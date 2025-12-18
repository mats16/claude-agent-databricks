/**
 * Chat input component with image upload support
 * Reusable input form for sending messages
 */

import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Input, Flex } from 'antd';
import { SendOutlined } from '@ant-design/icons';
import ImageUpload from './ImageUpload';
import type { AttachedImage } from './ImageUpload';
import { stickyInputStyle } from '../styles/common';
import { spacing } from '../styles/theme';

const { TextArea } = Input;

interface ChatInputProps {
  /** Current input value */
  input: string;
  /** Callback when input changes */
  onInputChange: (value: string) => void;
  /** Attached images */
  attachedImages: AttachedImage[];
  /** Callback when images change */
  onImagesChange: (images: AttachedImage[]) => void;
  /** Whether the input is disabled */
  disabled?: boolean;
  /** Whether image conversion is in progress */
  isConverting?: boolean;
  /** Callback when submit is triggered */
  onSubmit: () => void;
  /** Placeholder text */
  placeholder?: string;
}

export default function ChatInput({
  input,
  onInputChange,
  attachedImages,
  onImagesChange,
  disabled = false,
  isConverting = false,
  onSubmit,
  placeholder,
}: ChatInputProps) {
  const { t } = useTranslation();

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
        e.preventDefault();
        onSubmit();
      }
    },
    [onSubmit]
  );

  const isSubmitDisabled =
    disabled || isConverting || (!input.trim() && attachedImages.length === 0);

  return (
    <div style={stickyInputStyle}>
      <Flex vertical gap={spacing.sm}>
        {/* Image previews above input */}
        <ImageUpload
          images={attachedImages}
          onImagesChange={onImagesChange}
          disabled={disabled || isConverting}
          showButtonOnly={false}
        />
        <Flex gap={spacing.sm} align="flex-end">
          <TextArea
            value={input}
            onChange={(e) => onInputChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder || t('sessionPage.typeMessage')}
            disabled={disabled || isConverting}
            variant="borderless"
            autoSize={{ minRows: 1, maxRows: 9 }}
            style={{ flex: 1, padding: 0, alignSelf: 'stretch' }}
          />
          <ImageUpload
            images={attachedImages}
            onImagesChange={onImagesChange}
            disabled={disabled || isConverting}
            showButtonOnly={true}
          />
          <Button
            type="primary"
            shape="circle"
            icon={<SendOutlined />}
            disabled={isSubmitDisabled}
            loading={isConverting}
            onClick={onSubmit}
          />
        </Flex>
      </Flex>
    </div>
  );
}
