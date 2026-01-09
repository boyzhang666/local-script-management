import React, { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FileText, Trash2, RefreshCw, Download } from "lucide-react";
import { getProjectLogs, clearProjectLogs } from "@/api/processControl";
import { showSuccess, showError } from "@/utils/notification";

export default function LogsModal({ project, isOpen, onClose }) {
  const [logs, setLogs] = useState({ stdout: [], stderr: [] });
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('stdout');
  const scrollRef = useRef(null);

  const fetchLogs = async () => {
    if (!project?.id) return;

    setLoading(true);
    try {
      const data = await getProjectLogs(project.id);
      setLogs(data);
    } catch (error) {
      showError('获取日志失败', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleClearLogs = async () => {
    if (!project?.id) return;

    try {
      await clearProjectLogs(project.id);
      setLogs({ stdout: [], stderr: [] });
      showSuccess('日志已清除', '日志文件已成功清除');
    } catch (error) {
      showError('清除日志失败', error.message);
    }
  };

  const handleDownloadLogs = () => {
    const currentLogs = logs[activeTab] || [];
    const content = currentLogs.join('\n');
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${project.name}_${activeTab}_${new Date().toISOString().replace(/[:.]/g, '-')}.log`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showSuccess('下载成功', '日志文件已保存');
  };

  useEffect(() => {
    if (isOpen) {
      fetchLogs();
    }
  }, [isOpen, project?.id]);

  // 自动滚动到底部
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  if (!project) return null;

  const stdoutCount = logs.stdout?.length || 0;
  const stderrCount = logs.stderr?.length || 0;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            终端日志 - {project.name}
          </DialogTitle>
          <DialogDescription>
            查看任务运行时的终端输出日志（stdout 和 stderr）
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="stdout" className="flex items-center gap-2">
              标准输出 (stdout)
              {stdoutCount > 0 && (
                <span className="ml-1 px-2 py-0.5 text-xs bg-green-100 text-green-700 rounded-full">
                  {stdoutCount}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="stderr" className="flex items-center gap-2">
              标准错误 (stderr)
              {stderrCount > 0 && (
                <span className="ml-1 px-2 py-0.5 text-xs bg-red-100 text-red-700 rounded-full">
                  {stderrCount}
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="stdout" className="flex-1 mt-4">
            <ScrollArea
              ref={scrollRef}
              className="h-[calc(80vh-220px)] w-full rounded-lg border bg-gray-900"
            >
              <div className="p-4 font-mono text-sm text-green-400">
                {loading ? (
                  <div className="text-gray-400">加载中...</div>
                ) : logs.stdout?.length > 0 ? (
                  logs.stdout.map((line, idx) => (
                    <div key={idx} className="whitespace-pre-wrap break-all hover:bg-gray-800/50">
                      {line}
                    </div>
                  ))
                ) : (
                  <div className="text-gray-500">暂无标准输出日志</div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="stderr" className="flex-1 mt-4">
            <ScrollArea
              ref={scrollRef}
              className="h-[calc(80vh-220px)] w-full rounded-lg border bg-gray-900"
            >
              <div className="p-4 font-mono text-sm text-red-400">
                {loading ? (
                  <div className="text-gray-400">加载中...</div>
                ) : logs.stderr?.length > 0 ? (
                  logs.stderr.map((line, idx) => (
                    <div key={idx} className="whitespace-pre-wrap break-all hover:bg-gray-800/50">
                      {line}
                    </div>
                  ))
                ) : (
                  <div className="text-gray-500">暂无错误输出日志</div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>

        <DialogFooter className="flex justify-between items-center sm:justify-between">
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={fetchLogs}
              disabled={loading}
            >
              <RefreshCw className={`w-3 h-3 mr-1 ${loading ? 'animate-spin' : ''}`} />
              刷新
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleDownloadLogs}
              disabled={loading || (logs[activeTab]?.length || 0) === 0}
            >
              <Download className="w-3 h-3 mr-1" />
              下载
            </Button>
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="destructive"
              onClick={handleClearLogs}
              disabled={loading || (stdoutCount === 0 && stderrCount === 0)}
            >
              <Trash2 className="w-3 h-3 mr-1" />
              清除日志
            </Button>
            <Button size="sm" onClick={onClose}>
              关闭
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
