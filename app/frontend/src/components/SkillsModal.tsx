import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Modal,
  Button,
  Input,
  List,
  Flex,
  message,
  Spin,
  Typography,
  Empty,
  Popconfirm,
} from 'antd';
import {
  ThunderboltOutlined,
  PlusOutlined,
  DeleteOutlined,
  SaveOutlined,
} from '@ant-design/icons';
import { useSkills, type Skill } from '../hooks/useSkills';

const { TextArea } = Input;
const { Text } = Typography;

interface SkillsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SkillsModal({ isOpen, onClose }: SkillsModalProps) {
  const { t } = useTranslation();
  const {
    skills,
    loading,
    error,
    fetchSkills,
    createSkill,
    updateSkill,
    deleteSkill,
  } = useSkills();

  const [selectedSkill, setSelectedSkill] = useState<Skill | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [editedName, setEditedName] = useState('');
  const [editedContent, setEditedContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Fetch skills when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchSkills();
    }
  }, [isOpen, fetchSkills]);

  // Update edited fields when selected skill changes
  useEffect(() => {
    if (selectedSkill) {
      setEditedName(selectedSkill.name);
      setEditedContent(selectedSkill.content);
      setIsCreating(false);
    }
  }, [selectedSkill]);

  const handleNewSkill = () => {
    setIsCreating(true);
    setSelectedSkill(null);
    setEditedName('');
    setEditedContent('');
  };

  const handleSelectSkill = (skill: Skill) => {
    if (!isSaving) {
      setSelectedSkill(skill);
    }
  };

  const handleSave = async () => {
    // Validate
    if (!editedName.trim()) {
      message.error(t('skillsModal.nameRequired'));
      return;
    }

    if (!editedContent.trim()) {
      message.error(t('skillsModal.contentRequired'));
      return;
    }

    // Validate name format
    if (!/^[a-zA-Z0-9_-]+$/.test(editedName)) {
      message.error(t('skillsModal.invalidName'));
      return;
    }

    setIsSaving(true);
    let success = false;

    if (isCreating) {
      // Check for duplicate names
      if (skills.some((s) => s.name === editedName)) {
        message.error(t('skillsModal.nameExists'));
        setIsSaving(false);
        return;
      }
      success = await createSkill(editedName, editedContent);
    } else if (selectedSkill) {
      success = await updateSkill(selectedSkill.name, editedContent);
    }

    setIsSaving(false);

    if (success) {
      message.success(t('skillsModal.saved'));
      setIsCreating(false);
      // Select the newly created/updated skill
      if (isCreating) {
        const newSkill = { name: editedName, content: editedContent };
        setSelectedSkill(newSkill);
      }
    } else {
      message.error(t('skillsModal.saveFailed'));
    }
  };

  const handleDelete = async (skillName: string) => {
    setIsSaving(true);
    const success = await deleteSkill(skillName);
    setIsSaving(false);

    if (success) {
      message.success(t('skillsModal.deleted'));
      // Clear selection if deleted skill was selected
      if (selectedSkill?.name === skillName) {
        setSelectedSkill(null);
        setIsCreating(false);
      }
    } else {
      message.error(t('skillsModal.deleteFailed'));
    }
  };

  const handleCancel = () => {
    if (isCreating) {
      setIsCreating(false);
      setEditedName('');
      setEditedContent('');
    } else if (selectedSkill) {
      // Reset to original values
      setEditedName(selectedSkill.name);
      setEditedContent(selectedSkill.content);
    }
  };

  const hasChanges = isCreating
    ? editedName.trim() !== '' || editedContent.trim() !== ''
    : selectedSkill && editedContent !== selectedSkill.content;

  return (
    <Modal
      title={
        <Flex align="center" gap={8}>
          <ThunderboltOutlined style={{ color: '#f5a623' }} />
          {t('skillsModal.title')}
        </Flex>
      }
      open={isOpen}
      onCancel={onClose}
      width={900}
      footer={null}
      styles={{ body: { padding: 0, height: 600 } }}
    >
      {error && (
        <div style={{ padding: 16 }}>
          <Text type="danger">{error}</Text>
        </div>
      )}

      <Flex style={{ height: '100%' }}>
        {/* Left Panel - Skills List */}
        <div
          style={{
            width: 280,
            borderRight: '1px solid #f0f0f0',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <div style={{ padding: 16, borderBottom: '1px solid #f0f0f0' }}>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleNewSkill}
              disabled={loading || isSaving}
              block
            >
              {t('skillsModal.newSkill')}
            </Button>
          </div>

          <div style={{ flex: 1, overflow: 'auto' }}>
            {loading && skills.length === 0 ? (
              <Flex
                justify="center"
                align="center"
                style={{ height: '100%', padding: 24 }}
              >
                <Spin />
              </Flex>
            ) : skills.length === 0 ? (
              <Empty
                description={t('skillsModal.noSkills')}
                style={{ marginTop: 60 }}
              />
            ) : (
              <List
                dataSource={skills}
                renderItem={(skill) => (
                  <List.Item
                    key={skill.name}
                    onClick={() => handleSelectSkill(skill)}
                    style={{
                      cursor: 'pointer',
                      padding: '12px 16px',
                      background:
                        selectedSkill?.name === skill.name && !isCreating
                          ? '#f5f5f5'
                          : 'transparent',
                      borderLeft:
                        selectedSkill?.name === skill.name && !isCreating
                          ? '3px solid #f5a623'
                          : '3px solid transparent',
                    }}
                    actions={[
                      <Popconfirm
                        title={t('skillsModal.deleteConfirm')}
                        onConfirm={(e) => {
                          e?.stopPropagation();
                          handleDelete(skill.name);
                        }}
                        okText={t('common.ok')}
                        cancelText={t('common.cancel')}
                        disabled={isSaving}
                      >
                        <Button
                          type="text"
                          size="small"
                          icon={<DeleteOutlined />}
                          danger
                          disabled={isSaving}
                          onClick={(e) => e.stopPropagation()}
                        />
                      </Popconfirm>,
                    ]}
                  >
                    <List.Item.Meta
                      title={
                        <Text
                          ellipsis
                          style={{
                            fontWeight:
                              selectedSkill?.name === skill.name && !isCreating
                                ? 600
                                : 400,
                          }}
                        >
                          {skill.name}
                        </Text>
                      }
                    />
                  </List.Item>
                )}
              />
            )}
          </div>
        </div>

        {/* Right Panel - Editor */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            padding: 24,
          }}
        >
          {!selectedSkill && !isCreating ? (
            <Flex
              justify="center"
              align="center"
              style={{ height: '100%', color: '#999' }}
            >
              <Empty description={t('skillsModal.selectOrCreate')} />
            </Flex>
          ) : (
            <>
              <div style={{ marginBottom: 16 }}>
                <Text strong style={{ display: 'block', marginBottom: 8 }}>
                  {t('skillsModal.skillName')}
                </Text>
                <Input
                  value={editedName}
                  onChange={(e) => setEditedName(e.target.value)}
                  placeholder={t('skillsModal.skillNamePlaceholder')}
                  disabled={!isCreating || isSaving}
                  style={{ fontFamily: 'monospace' }}
                />
              </div>

              <div
                style={{ flex: 1, display: 'flex', flexDirection: 'column' }}
              >
                <Text strong style={{ display: 'block', marginBottom: 8 }}>
                  {t('skillsModal.skillContent')}
                </Text>
                <TextArea
                  value={editedContent}
                  onChange={(e) => setEditedContent(e.target.value)}
                  placeholder={t('skillsModal.skillContentPlaceholder')}
                  disabled={isSaving}
                  style={{
                    flex: 1,
                    fontFamily: 'monospace',
                    fontSize: 13,
                    resize: 'none',
                  }}
                />
              </div>

              <Flex gap={8} justify="flex-end" style={{ marginTop: 16 }}>
                <Button
                  onClick={handleCancel}
                  disabled={isSaving || !hasChanges}
                >
                  {t('skillsModal.cancel')}
                </Button>
                <Button
                  type="primary"
                  icon={<SaveOutlined />}
                  onClick={handleSave}
                  loading={isSaving}
                  disabled={!hasChanges}
                >
                  {t('skillsModal.save')}
                </Button>
              </Flex>
            </>
          )}
        </div>
      </Flex>
    </Modal>
  );
}
