import { useEffect, useRef } from 'react';
import * as monaco from 'monaco-editor';

// Configure Monaco Editor workers
if (typeof window !== 'undefined') {
  window.MonacoEnvironment = {
    getWorkerUrl: function (moduleId, label) {
      if (label === 'json') {
        return './monaco-editor/esm/vs/language/json/json.worker.js';
      }
      if (label === 'css' || label === 'scss' || label === 'less') {
        return './monaco-editor/esm/vs/language/css/css.worker.js';
      }
      if (label === 'html' || label === 'handlebars' || label === 'razor') {
        return './monaco-editor/esm/vs/language/html/html.worker.js';
      }
      if (label === 'typescript' || label === 'javascript') {
        return './monaco-editor/esm/vs/language/typescript/ts.worker.js';
      }
      return './monaco-editor/esm/vs/editor/editor.worker.js';
    }
  };
}

const CodeEditor = ({
  value = '',
  onChange,
  language = 'javascript',
  theme = 'vs-dark',
  height = '400px',
  readOnly = false,
  options = {},
}) => {
  const editorRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Create editor
    const editor = monaco.editor.create(containerRef.current, {
      value,
      language,
      theme,
      readOnly,
      minimap: { enabled: false },
      scrollBeyondLastLine: false,
      fontSize: 14,
      lineNumbers: 'on',
      wordWrap: 'on',
      automaticLayout: true,
      ...options,
    });

    editorRef.current = editor;

    // Handle content changes
    const changeListener = editor.onDidChangeModelContent(() => {
      const currentValue = editor.getValue();
      if (onChange) {
        onChange(currentValue);
      }
    });

    return () => {
      changeListener.dispose();
      editor.dispose();
    };
  }, []);

  useEffect(() => {
    if (editorRef.current && value !== editorRef.current.getValue()) {
      editorRef.current.setValue(value);
    }
  }, [value]);

  useEffect(() => {
    if (editorRef.current) {
      monaco.editor.setModelLanguage(
        editorRef.current.getModel(),
        language
      );
    }
  }, [language]);

  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.updateOptions({ readOnly });
    }
  }, [readOnly]);

  return (
    <div 
      ref={containerRef} 
      style={{ height, width: '100%' }}
      className="border border-gray-300 rounded-md"
    />
  );
};

export default CodeEditor;
