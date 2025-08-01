import React, { forwardRef, useEffect, useState } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Square, Loader2, ArrowUp, Plug } from 'lucide-react';
import { cn } from '@/lib/utils';
import { UploadedFile } from './chat-input';
import { FileUploadHandler } from './file-upload-handler';
import { VoiceRecorder } from './voice-recorder';
import { ModelSelector } from './model-selector';
import { AgentSelector } from './agent-selector';
import { canAccessModel, SubscriptionStatus } from './_use-model-selection';
import { isLocalMode } from '@/lib/config';
import { useFeatureFlag } from '@/lib/feature-flags';
import { TooltipContent } from '@/components/ui/tooltip';
import { Tooltip } from '@/components/ui/tooltip';
import { TooltipProvider, TooltipTrigger } from '@radix-ui/react-tooltip';
import { BillingModal } from '@/components/billing/billing-modal';
import ChatDropdown from './chat-dropdown';
import { handleFiles } from './file-upload-handler';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useAgent } from '@/hooks/react-query/agents/use-agents';

interface MessageInputProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onSubmit: (e: React.FormEvent) => void;
  onTranscription: (text: string) => void;
  placeholder: string;
  loading: boolean;
  disabled: boolean;
  isAgentRunning: boolean;
  onStopAgent?: () => void;
  isDraggingOver: boolean;
  uploadedFiles: UploadedFile[];

  fileInputRef: React.RefObject<HTMLInputElement>;
  isUploading: boolean;
  sandboxId?: string;
  setPendingFiles: React.Dispatch<React.SetStateAction<File[]>>;
  setUploadedFiles: React.Dispatch<React.SetStateAction<UploadedFile[]>>;
  setIsUploading: React.Dispatch<React.SetStateAction<boolean>>;
  hideAttachments?: boolean;
  messages?: any[]; // Add messages prop
  isLoggedIn?: boolean;

  selectedModel: string;
  onModelChange: (model: string) => void;
  modelOptions: any[];
  subscriptionStatus: SubscriptionStatus;
  canAccessModel: (modelId: string) => boolean;
  refreshCustomModels?: () => void;
  selectedAgentId?: string;
  onAgentSelect?: (agentId: string | undefined) => void;
  enableAdvancedConfig?: boolean;
  hideAgentSelection?: boolean;
  isSunaAgent?: boolean;
}

export const MessageInput = forwardRef<HTMLTextAreaElement, MessageInputProps>(
  (
    {
      value,
      onChange,
      onSubmit,
      onTranscription,
      placeholder,
      loading,
      disabled,
      isAgentRunning,
      onStopAgent,
      isDraggingOver,
      uploadedFiles,

      fileInputRef,
      isUploading,
      sandboxId,
      setPendingFiles,
      setUploadedFiles,
      setIsUploading,
      hideAttachments = false,
      messages = [],
      isLoggedIn = true,

      selectedModel,
      onModelChange,
      modelOptions,
      subscriptionStatus,
      canAccessModel,
      refreshCustomModels,

      selectedAgentId,
      onAgentSelect,
      enableAdvancedConfig = false,
      hideAgentSelection = false,
      isSunaAgent,
    },
    ref,
  ) => {
    const [billingModalOpen, setBillingModalOpen] = useState(false);
    const [integrationsOpen, setIntegrationsOpen] = useState(false);
    const { enabled: customAgentsEnabled, loading: flagsLoading } = useFeatureFlag('custom_agents');
    
    // Fetch agent data to get integrations
    const { data: agentData } = useAgent(selectedAgentId || '');

    useEffect(() => {
      const textarea = ref as React.RefObject<HTMLTextAreaElement>;
      if (!textarea.current) return;

      const adjustHeight = () => {
        const el = textarea.current;
        if (!el) return;
        el.style.height = 'auto';
        el.style.maxHeight = '200px';
        el.style.overflowY = el.scrollHeight > 200 ? 'auto' : 'hidden';

        const newHeight = Math.min(el.scrollHeight, 200);
        el.style.height = `${newHeight}px`;
      };

      adjustHeight();

      window.addEventListener('resize', adjustHeight);
      return () => window.removeEventListener('resize', adjustHeight);
    }, [value, ref]);

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
        e.preventDefault();
        if (
          (value.trim() || uploadedFiles.length > 0) &&
          !loading &&
          (!disabled || isAgentRunning)
        ) {
          onSubmit(e as unknown as React.FormEvent);
        }
      }
    };

    const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
      if (!e.clipboardData) return;
      const items = Array.from(e.clipboardData.items);
      const imageFiles: File[] = [];
      for (const item of items) {
        if (item.kind === 'file' && item.type.startsWith('image/')) {
          const file = item.getAsFile();
          if (file) imageFiles.push(file);
        }
      }
      if (imageFiles.length > 0) {
        e.preventDefault();
        handleFiles(
          imageFiles,
          sandboxId,
          setPendingFiles,
          setUploadedFiles,
          setIsUploading,
          messages,
        );
      }
    };

    const renderDropdown = () => {
      if (isLoggedIn) {
        const showAdvancedFeatures = enableAdvancedConfig || (customAgentsEnabled && !flagsLoading);

        return (
          <div className="flex items-center gap-2">
            {showAdvancedFeatures && !hideAgentSelection && (
              <AgentSelector
                selectedAgentId={selectedAgentId}
                onAgentSelect={onAgentSelect}
                disabled={loading || (disabled && !isAgentRunning)}
                isSunaAgent={isSunaAgent}
              />
            )}
            <ModelSelector
              selectedModel={selectedModel}
              onModelChange={onModelChange}
              modelOptions={modelOptions}
              subscriptionStatus={subscriptionStatus}
              canAccessModel={canAccessModel}
              refreshCustomModels={refreshCustomModels}
              billingModalOpen={billingModalOpen}
              setBillingModalOpen={setBillingModalOpen}
            />
          </div>
        );
      }
      return <ChatDropdown />;
    }

    return (
      <div className="relative flex flex-col w-full h-full gap-2 justify-between">

        <div className="flex flex-col gap-1 px-2">
          <Textarea
            ref={ref}
            value={value}
            onChange={onChange}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            placeholder={placeholder}
            className={cn(
              'w-full bg-transparent dark:bg-transparent border-none shadow-none focus-visible:ring-0 px-0.5 pb-6 pt-4 !text-[15px] min-h-[36px] max-h-[200px] overflow-y-auto resize-none',
              isDraggingOver ? 'opacity-40' : '',
            )}
            disabled={loading || (disabled && !isAgentRunning)}
            rows={1}
          />
        </div>


        <div className="flex items-center justify-between mt-0 mb-1 px-2">
          <div className="flex items-center gap-3">
            {!hideAttachments && (
              <FileUploadHandler
                ref={fileInputRef}
                loading={loading}
                disabled={disabled}
                isAgentRunning={isAgentRunning}
                isUploading={isUploading}
                sandboxId={sandboxId}
                setPendingFiles={setPendingFiles}
                setUploadedFiles={setUploadedFiles}
                setIsUploading={setIsUploading}
                messages={messages}
                isLoggedIn={isLoggedIn}
              />
            )}

          </div>

          {/* {subscriptionStatus === 'no_subscription' && !isLocalMode() &&
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <p role='button' className='text-sm text-amber-500 hidden sm:block cursor-pointer' onClick={() => setBillingModalOpen(true)}>Upgrade for more usage</p>
                </TooltipTrigger>
                <TooltipContent>
                  <p>The free tier is severely limited by the amount of usage. Upgrade to experience the full power of Suna.</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          } */}

          <div className='flex items-center gap-2'>
            {renderDropdown()}
            <BillingModal
              open={billingModalOpen}
              onOpenChange={setBillingModalOpen}
              returnUrl={typeof window !== 'undefined' ? window.location.href : '/'}
            />

            {/* Agent Integrations Button */}
            {isLoggedIn && selectedAgentId && agentData && (
              <Popover open={integrationsOpen} onOpenChange={setIntegrationsOpen}>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="w-8 h-8 p-0 rounded-lg hover:bg-muted/50"
                    disabled={loading || (disabled && !isAgentRunning)}
                  >
                    <Plug className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80" align="end" side="top">
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm">Agent Integrations</h4>
                    {(agentData.configured_mcps && agentData.configured_mcps.length > 0) || 
                     (agentData.custom_mcps && agentData.custom_mcps.length > 0) ? (
                      <div className="space-y-2">
                        {agentData.configured_mcps?.map((mcp, index) => (
                          <div key={`configured-${index}`} className="flex items-center gap-2 text-sm">
                            <div className="w-2 h-2 rounded-full bg-green-500" />
                            <span className="text-muted-foreground">{mcp.name}</span>
                          </div>
                        ))}
                        {agentData.custom_mcps?.map((mcp, index) => (
                          <div key={`custom-${index}`} className="flex items-center gap-2 text-sm">
                            <div className="w-2 h-2 rounded-full bg-blue-500" />
                            <span className="text-muted-foreground">{mcp.name}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">No integrations configured</p>
                    )}
                  </div>
                </PopoverContent>
              </Popover>
            )}

            {isLoggedIn && <VoiceRecorder
              onTranscription={onTranscription}
              disabled={loading || (disabled && !isAgentRunning)}
            />}

            <Button
              type="submit"
              onClick={isAgentRunning && onStopAgent ? onStopAgent : onSubmit}
              size="sm"
              className={cn(
                'w-8 h-8 flex-shrink-0 self-end rounded-xl',
                (!value.trim() && uploadedFiles.length === 0 && !isAgentRunning) ||
                  loading ||
                  (disabled && !isAgentRunning)
                  ? 'opacity-50'
                  : '',
              )}
              disabled={
                (!value.trim() && uploadedFiles.length === 0 && !isAgentRunning) ||
                loading ||
                (disabled && !isAgentRunning)
              }
            >
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : isAgentRunning ? (
                <div className="min-h-[14px] min-w-[14px] w-[14px] h-[14px] rounded-sm bg-current" />
              ) : (
                <ArrowUp className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>
        {/* {subscriptionStatus === 'no_subscription' && !isLocalMode() &&
          <div className='sm:hidden absolute -bottom-8 left-0 right-0 flex justify-center'>
            <p className='text-xs text-amber-500 px-2 py-1'>
              Upgrade for better performance
            </p>
          </div>
        } */}
      </div>
    );
  },
);

MessageInput.displayName = 'MessageInput';