import { Button } from './ui/button';
import { ScrollArea } from './ui/scroll-area';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from './ui/sheet';
import { Conversation } from '../App';
import { MessageSquare, X, Clock } from 'lucide-react';

interface SidebarProps {
  conversations: Conversation[];
  isOpen: boolean;
  onClose: () => void;
  onSelectConversation: (conversation: Conversation) => void;
}

export function Sidebar({ conversations, isOpen, onClose, onSelectConversation }: SidebarProps) {
  const formatDate = (date: Date) => {
    const now = new Date();
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) {
      return '오늘';
    } else if (diffInDays === 1) {
      return '어제';
    } else if (diffInDays < 7) {
      return `${diffInDays}일 전`;
    } else {
      return new Intl.DateTimeFormat('ko-KR', {
        month: 'numeric',
        day: 'numeric'
      }).format(date);
    }
  };

  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat('ko-KR', {
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const groupedConversations = conversations.reduce((acc, conversation) => {
    const dateKey = formatDate(conversation.timestamp);
    if (!acc[dateKey]) {
      acc[dateKey] = [];
    }
    acc[dateKey].push(conversation);
    return acc;
  }, {} as Record<string, Conversation[]>);

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="left" className="w-80 p-0">
        <SheetHeader className="p-6 border-b">
          <div className="flex items-center justify-between">
            <SheetTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              대화 기록
            </SheetTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </SheetHeader>

        <ScrollArea className="flex-1 h-[calc(100vh-80px)]">
          <div className="p-4">
            {conversations.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>아직 대화 기록이 없습니다</p>
                <p className="text-sm mt-1">대화를 시작해보세요</p>
              </div>
            ) : (
              Object.entries(groupedConversations).map(([dateGroup, convs]) => (
                <div key={dateGroup} className="mb-6">
                  <h3 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    {dateGroup}
                  </h3>
                  <div className="space-y-2">
                    {convs.map((conversation) => (
                      <Button
                        key={conversation.id}
                        variant="ghost"
                        className="w-full h-auto p-3 text-left justify-start hover:bg-accent"
                        onClick={() => {
                          onSelectConversation(conversation);
                          onClose();
                        }}
                      >
                        <div className="flex flex-col items-start w-full">
                          <div className="flex items-center gap-2 w-full mb-1">
                            <MessageSquare className="h-4 w-4 flex-shrink-0" />
                            <span className="text-sm font-medium truncate flex-1">
                              {conversation.title}
                            </span>
                          </div>
                          <div className="flex items-center justify-between w-full">
                            <span className="text-xs text-muted-foreground">
                              {conversation.messages.length}개 메시지
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {formatTime(conversation.timestamp)}
                            </span>
                          </div>
                        </div>
                      </Button>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}