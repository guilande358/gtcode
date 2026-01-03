import { useRef, useEffect } from 'react';
import Editor, { OnMount, BeforeMount } from '@monaco-editor/react';
import { 
  GCODEFORCE_LANGUAGE_ID, 
  languageConfiguration, 
  monarchTokensProvider,
  completionItems,
  keywords,
  builtinFunctions,
  typeKeywords
} from '@/lib/gcodeforce-language';

interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  theme: 'light' | 'dark';
}

export function CodeEditor({ value, onChange, theme }: CodeEditorProps) {
  const editorRef = useRef<any>(null);

  const handleBeforeMount: BeforeMount = (monaco) => {
    // Register the GcodeForce language
    monaco.languages.register({ id: GCODEFORCE_LANGUAGE_ID });

    // Set language configuration
    monaco.languages.setLanguageConfiguration(
      GCODEFORCE_LANGUAGE_ID,
      languageConfiguration as any
    );

    // Set monarch tokens provider for syntax highlighting
    monaco.languages.setMonarchTokensProvider(
      GCODEFORCE_LANGUAGE_ID,
      monarchTokensProvider as any
    );

    // Register completion provider
    monaco.languages.registerCompletionItemProvider(GCODEFORCE_LANGUAGE_ID, {
      provideCompletionItems: (model, position) => {
        const word = model.getWordUntilPosition(position);
        const range = {
          startLineNumber: position.lineNumber,
          endLineNumber: position.lineNumber,
          startColumn: word.startColumn,
          endColumn: word.endColumn,
        };

        const suggestions = [
          ...keywords.map(k => ({
            label: k,
            kind: monaco.languages.CompletionItemKind.Keyword,
            insertText: k,
            range,
          })),
          ...typeKeywords.map(t => ({
            label: t,
            kind: monaco.languages.CompletionItemKind.TypeParameter,
            insertText: t,
            range,
          })),
          ...builtinFunctions.map(f => ({
            label: f,
            kind: monaco.languages.CompletionItemKind.Function,
            insertText: `${f}($0)`,
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            range,
          })),
          ...completionItems.map(item => ({
            label: item.label,
            kind: monaco.languages.CompletionItemKind[item.kind as keyof typeof monaco.languages.CompletionItemKind] || monaco.languages.CompletionItemKind.Text,
            insertText: item.insertText,
            insertTextRules: 'insertTextRules' in item ? item.insertTextRules : undefined,
            documentation: item.documentation,
            range,
          })),
        ];

        return { suggestions };
      },
    });

    // Define custom themes
    monaco.editor.defineTheme('gcodeforce-dark', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'keyword', foreground: 'a78bfa', fontStyle: 'bold' },
        { token: 'type', foreground: 'f472b6' },
        { token: 'function.builtin', foreground: 'fbbf24' },
        { token: 'identifier', foreground: 'e2e8f0' },
        { token: 'string', foreground: '4ade80' },
        { token: 'string.escape', foreground: '22d3ee' },
        { token: 'number', foreground: '38bdf8' },
        { token: 'number.hex', foreground: 'fb923c' },
        { token: 'comment', foreground: '64748b', fontStyle: 'italic' },
        { token: 'operator', foreground: '94a3b8' },
        { token: 'delimiter', foreground: '94a3b8' },
      ],
      colors: {
        'editor.background': '#0f172a',
        'editor.foreground': '#e2e8f0',
        'editor.lineHighlightBackground': '#1e293b',
        'editor.selectionBackground': '#6366f150',
        'editorCursor.foreground': '#a78bfa',
        'editorLineNumber.foreground': '#475569',
        'editorLineNumber.activeForeground': '#94a3b8',
        'editor.inactiveSelectionBackground': '#334155',
        'editorIndentGuide.background': '#334155',
        'editorIndentGuide.activeBackground': '#475569',
      },
    });

    monaco.editor.defineTheme('gcodeforce-light', {
      base: 'vs',
      inherit: true,
      rules: [
        { token: 'keyword', foreground: '7c3aed', fontStyle: 'bold' },
        { token: 'type', foreground: 'db2777' },
        { token: 'function.builtin', foreground: 'd97706' },
        { token: 'identifier', foreground: '1e293b' },
        { token: 'string', foreground: '16a34a' },
        { token: 'string.escape', foreground: '0891b2' },
        { token: 'number', foreground: '0284c7' },
        { token: 'number.hex', foreground: 'ea580c' },
        { token: 'comment', foreground: '64748b', fontStyle: 'italic' },
        { token: 'operator', foreground: '475569' },
        { token: 'delimiter', foreground: '475569' },
      ],
      colors: {
        'editor.background': '#ffffff',
        'editor.foreground': '#1e293b',
        'editor.lineHighlightBackground': '#f1f5f9',
        'editor.selectionBackground': '#c4b5fd50',
        'editorCursor.foreground': '#7c3aed',
        'editorLineNumber.foreground': '#94a3b8',
        'editorLineNumber.activeForeground': '#475569',
        'editor.inactiveSelectionBackground': '#e2e8f0',
        'editorIndentGuide.background': '#e2e8f0',
        'editorIndentGuide.activeBackground': '#cbd5e1',
      },
    });
  };

  const handleMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;

    // Focus the editor
    editor.focus();

    // Add keyboard shortcuts
    editor.addCommand(monaco.KeyCode.F5, () => {
      // Trigger run - will be handled by parent
      const event = new CustomEvent('gcodeforce-run');
      window.dispatchEvent(event);
    });
  };

  const handleChange = (value: string | undefined) => {
    onChange(value || '');
  };

  return (
    <div className="h-full w-full">
      <Editor
        height="100%"
        defaultLanguage={GCODEFORCE_LANGUAGE_ID}
        language={GCODEFORCE_LANGUAGE_ID}
        value={value}
        onChange={handleChange}
        beforeMount={handleBeforeMount}
        onMount={handleMount}
        theme={theme === 'dark' ? 'gcodeforce-dark' : 'gcodeforce-light'}
        options={{
          fontSize: 14,
          fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', Consolas, monospace",
          fontLigatures: true,
          minimap: { enabled: false },
          scrollBeyondLastLine: false,
          wordWrap: 'on',
          lineNumbers: 'on',
          renderLineHighlight: 'line',
          cursorBlinking: 'smooth',
          cursorSmoothCaretAnimation: 'on',
          smoothScrolling: true,
          padding: { top: 16, bottom: 16 },
          automaticLayout: true,
          bracketPairColorization: { enabled: true },
          guides: {
            bracketPairs: true,
            indentation: true,
          },
          suggest: {
            showKeywords: true,
            showSnippets: true,
            showFunctions: true,
          },
          quickSuggestions: {
            other: true,
            comments: false,
            strings: true,
          },
          tabSize: 2,
          insertSpaces: true,
        }}
      />
    </div>
  );
}
