import type { FastifyPluginAsync } from 'fastify';
import type { WebSocket } from 'ws';
import * as fs from 'fs';
import * as pty from 'node-pty';
import { extractRequestContextFromHeaders } from '../../../utils/headers.js';
import { getSessionById } from '../../../db/sessions.js';

// Store active terminal sessions
const terminalSessions = new Map<
  string,
  { pty: pty.IPty; sockets: Set<WebSocket> }
>();

const terminalWebSocketRoutes: FastifyPluginAsync = async (fastify) => {
  // WebSocket endpoint for terminal access
  fastify.get<{ Params: { sessionId: string } }>(
    '/:sessionId/terminal/ws',
    { websocket: true },
    async (socket, req) => {
      const sessionId = req.params.sessionId;
      console.log(`Terminal WebSocket connected for session: ${sessionId}`);

      // Get user info from request headers
      let context;
      try {
        context = extractRequestContextFromHeaders(req.headers);
      } catch (error: any) {
        socket.send(JSON.stringify({ type: 'error', error: error.message }));
        socket.close();
        return;
      }

      const { user } = context;
      const userId = user.sub;

      // Verify session exists and belongs to user
      const session = await getSessionById(sessionId, userId);
      if (!session) {
        socket.send(
          JSON.stringify({ type: 'error', error: 'Session not found' })
        );
        socket.close();
        return;
      }

      // Get the agent's local working directory
      // Validate that the directory exists, fallback to HOME or /tmp
      let cwd = session.agentLocalPath || process.env.HOME || '/tmp';
      if (!fs.existsSync(cwd)) {
        console.warn(
          `Terminal cwd does not exist: ${cwd}, falling back to HOME`
        );
        cwd = process.env.HOME || '/tmp';
        if (!fs.existsSync(cwd)) {
          cwd = '/tmp';
        }
      }

      // Check if terminal session already exists for this session
      let terminalSession = terminalSessions.get(sessionId);

      if (!terminalSession) {
        // Create new PTY
        const shell = process.env.SHELL || '/bin/bash';

        let ptyProcess: pty.IPty;
        try {
          ptyProcess = pty.spawn(shell, [], {
            name: 'xterm-256color',
            cols: 80,
            rows: 24,
            cwd,
            env: {
              ...process.env,
              TERM: 'xterm-256color',
            } as Record<string, string>,
          });
        } catch (spawnError: any) {
          console.error('Failed to spawn PTY:', spawnError);
          socket.send(
            JSON.stringify({
              type: 'error',
              error: `Failed to start terminal: ${spawnError.message}`,
            })
          );
          socket.close();
          return;
        }

        terminalSession = {
          pty: ptyProcess,
          sockets: new Set(),
        };
        terminalSessions.set(sessionId, terminalSession);

        // Handle PTY output - send to all connected sockets
        ptyProcess.onData((data) => {
          const message = JSON.stringify({ type: 'output', data });
          terminalSession!.sockets.forEach((ws) => {
            try {
              ws.send(message);
            } catch (e) {
              console.error('Failed to send terminal output:', e);
            }
          });
        });

        // Handle PTY exit
        ptyProcess.onExit(({ exitCode, signal }) => {
          console.log(
            `Terminal PTY exited for session ${sessionId}: code=${exitCode}, signal=${signal}`
          );
          const exitMessage = JSON.stringify({
            type: 'exit',
            exitCode,
            signal,
          });
          terminalSession!.sockets.forEach((ws) => {
            try {
              ws.send(exitMessage);
            } catch (e) {
              console.error('Failed to send exit message:', e);
            }
          });
          terminalSessions.delete(sessionId);
        });
      }

      // Add this socket to the terminal session
      terminalSession.sockets.add(socket);

      // Send connected message with current terminal size
      socket.send(JSON.stringify({ type: 'connected', cwd }));

      // Handle incoming messages from client
      socket.on('message', (messageBuffer: Buffer) => {
        try {
          const messageStr = messageBuffer.toString();
          const message = JSON.parse(messageStr);

          if (message.type === 'input' && terminalSession?.pty) {
            // Write input to PTY
            terminalSession.pty.write(message.data);
          } else if (message.type === 'resize' && terminalSession?.pty) {
            // Resize PTY
            const { cols, rows } = message;
            if (
              typeof cols === 'number' &&
              typeof rows === 'number' &&
              cols > 0 &&
              rows > 0
            ) {
              terminalSession.pty.resize(cols, rows);
            }
          }
        } catch (error) {
          console.error('Terminal WebSocket message error:', error);
        }
      });

      // Handle socket close
      socket.on('close', () => {
        console.log(
          `Terminal WebSocket disconnected for session: ${sessionId}`
        );
        if (terminalSession) {
          terminalSession.sockets.delete(socket);

          // Clean up PTY if no more connections
          if (terminalSession.sockets.size === 0) {
            console.log(
              `Killing PTY for session ${sessionId} (no connections)`
            );
            terminalSession.pty.kill();
            terminalSessions.delete(sessionId);
          }
        }
      });

      // Handle socket error
      socket.on('error', (error: Error) => {
        console.error('Terminal WebSocket error:', error);
      });
    }
  );
};

export default terminalWebSocketRoutes;
