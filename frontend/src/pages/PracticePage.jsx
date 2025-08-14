import { useState, useEffect } from 'react'
import { useTheme } from '@/contexts/ThemeContext'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { SEO, seoConfigs } from '@/components/SEO'
import { Play, Code, Terminal } from 'lucide-react'
import { apiClient } from '@/lib/api'
import Editor from '@monaco-editor/react'

export function PracticePage() {
  const { theme } = useTheme()
  const [languages, setLanguages] = useState([])
  const [selectedLanguage, setSelectedLanguage] = useState('')
  const [sourceCode, setSourceCode] = useState('')
  const [stdin, setStdin] = useState('')
  const [output, setOutput] = useState(null)
  const [isExecuting, setIsExecuting] = useState(false)

  // Language mapping for Monaco Editor
  const getMonacoLanguage = (languageId) => {
    const langMap = {
      71: 'python',     // Python 3
      70: 'python',     // Python 2
      62: 'java',       // Java
      54: 'cpp',        // C++
      53: 'cpp',        // C++
      52: 'cpp',        // C++
      76: 'cpp',        // C++ Clang
      75: 'cpp',        // C++ Clang
      50: 'c',          // C
      49: 'c',          // C
      48: 'c',          // C
      63: 'javascript', // JavaScript
      74: 'typescript', // TypeScript
      51: 'csharp',     // C#
      87: 'fsharp',     // F#
      72: 'ruby',       // Ruby
      68: 'php',        // PHP
      60: 'go',         // Go
      73: 'rust',       // Rust
      78: 'kotlin',     // Kotlin
      81: 'scala',      // Scala
      83: 'swift',      // Swift
    }
    return langMap[parseInt(languageId)] || 'plaintext'
  }

  // Default code templates for different languages
  const codeTemplates = {
    71: `# Python 3
print("Hello, World!")

# Read input
# n = int(input())
# arr = list(map(int, input().split()))`,
    62: `// Java
import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        System.out.println("Hello, World!");
        
        // Read input
        // int n = sc.nextInt();
        // int[] arr = new int[n];
        // for(int i = 0; i < n; i++) {
        //     arr[i] = sc.nextInt();
        // }
    }
}`,
    54: `// C++
#include <iostream>
#include <vector>
using namespace std;

int main() {
    cout << "Hello, World!" << endl;
    
    // Read input
    // int n;
    // cin >> n;
    // vector<int> arr(n);
    // for(int i = 0; i < n; i++) {
    //     cin >> arr[i];
    // }
    
    return 0;
}`,
    50: `// C
#include <stdio.h>

int main() {
    printf("Hello, World!\\n");
    
    // Read input
    // int n;
    // scanf("%d", &n);
    // int arr[n];
    // for(int i = 0; i < n; i++) {
    //     scanf("%d", &arr[i]);
    // }
    
    return 0;
}`,
    63: `// JavaScript (Node.js)
console.log("Hello, World!");

// Read input
// const readline = require('readline');
// const rl = readline.createInterface({
//     input: process.stdin,
//     output: process.stdout
// });
// 
// rl.on('line', (input) => {
//     console.log(input);
//     rl.close();
// });`,
    72: `# Ruby
puts "Hello, World!"

# Read input
# n = gets.to_i
# arr = gets.split.map(&:to_i)`,
    68: `<?php
echo "Hello, World!\\n";

// Read input
// $n = intval(trim(fgets(STDIN)));
// $arr = array_map('intval', explode(' ', trim(fgets(STDIN))));
?>`,
    60: `// Go
package main

import "fmt"

func main() {
    fmt.Println("Hello, World!")
    
    // Read input
    // var n int
    // fmt.Scan(&n)
}`,
    73: `// Rust
fn main() {
    println!("Hello, World!");
    
    // Read input
    // use std::io;
    // let mut input = String::new();
    // io::stdin().read_line(&mut input).expect("Failed to read line");
}`
  }

  useEffect(() => {
    fetchLanguages()
  }, [])

  const fetchLanguages = async () => {
    try {
      const response = await apiClient.request('/api/practice/languages')
      if (response.success) {
        setLanguages(response.languages)
        // Set default language to Python
        const python = response.languages.find(lang => lang.id === 71)
        if (python) {
          setSelectedLanguage('71')
          setSourceCode(codeTemplates[71] || '')
        }
      }
    } catch (error) {
      console.error('Failed to fetch languages:', error)
      // Fallback to some basic languages if API fails
      const fallbackLanguages = [
        { id: 71, name: 'Python 3' },
        { id: 62, name: 'Java' },
        { id: 54, name: 'C++' },
        { id: 50, name: 'C' },
        { id: 63, name: 'JavaScript' }
      ]
      setLanguages(fallbackLanguages)
      setSelectedLanguage('71')
      setSourceCode(codeTemplates[71] || '')
    }
  }

  const handleLanguageChange = (languageId) => {
    setSelectedLanguage(languageId)
    setSourceCode(codeTemplates[parseInt(languageId)] || '')
    setOutput(null)
  }

  const executeCode = async () => {
    if (!selectedLanguage || !sourceCode.trim()) {
      alert('Please select a language and write some code')
      return
    }

    setIsExecuting(true)
    try {
      const response = await apiClient.request('/api/practice/execute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          source_code: sourceCode,
          language_id: selectedLanguage,
          stdin: stdin,
        }),
      })

      if (response.success) {
        setOutput(response.execution)
      }
    } catch (error) {
      console.error('Code execution failed:', error)
      setOutput({
        stderr: 'Failed to execute code. Please try again.',
        status: { description: 'Error' }
      })
    } finally {
      setIsExecuting(false)
    }
  }



  const getStatusColor = (status) => {
    if (!status) return 'secondary'
    const statusId = status.id
    if (statusId === 3) return 'default' // Accepted
    if (statusId === 4) return 'destructive' // Wrong Answer
    if (statusId === 5) return 'destructive' // Time Limit Exceeded
    if (statusId === 6) return 'destructive' // Compilation Error
    return 'secondary'
  }

  const selectedLangName = languages.find(lang => lang.id === parseInt(selectedLanguage))?.name || 'Select Language'

  return (
    <>
      <SEO {...seoConfigs.practice} />
      <div className="fixed inset-0 top-16 flex flex-col bg-background w-full">
        {/* Top Toolbar */}
        <div className="border-b bg-card px-4 py-2 flex items-center justify-between flex-shrink-0 h-12">
          <div className="flex items-center space-x-4">
            <h1 className="text-lg font-semibold flex items-center space-x-2">
              <Code className="h-5 w-5" />
              <span>Practice Mode</span>
            </h1>
            
            <select 
              value={selectedLanguage} 
              onChange={(e) => handleLanguageChange(e.target.value)}
              className="h-8 rounded border border-input bg-background px-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">Select Language</option>
              {languages.map((lang) => (
                <option key={lang.id} value={lang.id.toString()}>
                  {lang.name}
                </option>
              ))}
            </select>
            
            {selectedLanguage && (
              <Badge variant="outline" className="text-xs">
                {selectedLangName}
              </Badge>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              onClick={executeCode}
              disabled={isExecuting || !selectedLanguage}
              size="sm"
              className="bg-green-600 hover:bg-green-700"
            >
              <Play className="h-4 w-4 mr-1" />
              {isExecuting ? 'Running...' : 'Run'}
            </Button>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex min-h-0">
          {/* Left Panel - Code Editor */}
          <div className="flex-1 flex flex-col border-r min-w-0">
            {/* Editor Header */}
            <div className="border-b bg-muted/30 px-4 py-2 text-sm font-medium flex-shrink-0">
              Source Code
            </div>

            {/* Monaco Editor */}
            <div className="flex-1 min-h-0 border border-border rounded-lg overflow-hidden">
              <Editor
                height="100%"
                language={getMonacoLanguage(selectedLanguage)}
                theme={theme === 'dark' ? 'vs-dark' : 'light'}
                value={sourceCode}
                onChange={(value) => setSourceCode(value || '')}
                options={{
                  minimap: { enabled: false },
                  scrollBeyondLastLine: false,
                  fontSize: 14,
                  lineNumbers: 'on',
                  wordWrap: 'on',
                  automaticLayout: true,
                }}
                loading={
                  <div className="flex items-center justify-center h-full">
                    <div className="text-muted-foreground">Loading editor...</div>
                  </div>
                }
              />
            </div>
          </div>

          {/* Right Panel - Input/Output */}
          <div className="w-96 flex flex-col flex-shrink-0">
            {/* Input Section */}
            <div className="h-1/3 border-b flex flex-col min-h-0">
              <div className="border-b bg-muted/30 px-4 py-2 text-sm font-medium flex items-center justify-between flex-shrink-0">
                <span>Input</span>
                <span className="text-xs text-muted-foreground">Enter input here</span>
              </div>
              <div className="flex-1 p-2 min-h-0">
                <textarea
                  value={stdin}
                  onChange={(e) => setStdin(e.target.value)}
                  placeholder="If your code takes input, add it in the above box before running"
                  className="w-full h-full resize-none border-0 bg-transparent text-sm font-mono focus:outline-none placeholder:text-muted-foreground"
                />
              </div>
            </div>

            {/* Output Section */}
            <div className="flex-1 flex flex-col min-h-0">
              <div className="border-b bg-muted/30 px-4 py-2 text-sm font-medium flex items-center justify-between flex-shrink-0">
                <span>Output</span>
                {output && (
                  <div className="flex items-center space-x-2">
                    <Badge variant={getStatusColor(output.status)} className="text-xs">
                      {output.status?.description || 'Unknown'}
                    </Badge>
                    {output.time && (
                      <Badge variant="outline" className="text-xs">
                        {output.time}s
                      </Badge>
                    )}
                  </div>
                )}
              </div>

              <div className="flex-1 p-2 overflow-auto min-h-0">
                {output ? (
                  <div className="space-y-3">
                    {/* Standard Output */}
                    {output.stdout && (
                      <div>
                        <div className="text-xs font-medium text-green-600 mb-1">Standard Output:</div>
                        <pre className="text-sm font-mono whitespace-pre-wrap bg-muted/50 p-2 rounded">
                          {output.stdout}
                        </pre>
                      </div>
                    )}

                    {/* Standard Error */}
                    {output.stderr && (
                      <div>
                        <div className="text-xs font-medium text-red-600 mb-1">Standard Error:</div>
                        <pre className="text-sm font-mono whitespace-pre-wrap bg-red-50 dark:bg-red-950/50 p-2 rounded text-red-700 dark:text-red-300">
                          {output.stderr}
                        </pre>
                      </div>
                    )}

                    {/* Compilation Output */}
                    {output.compile_output && (
                      <div>
                        <div className="text-xs font-medium text-yellow-600 mb-1">Compilation Output:</div>
                        <pre className="text-sm font-mono whitespace-pre-wrap bg-yellow-50 dark:bg-yellow-950/50 p-2 rounded text-yellow-700 dark:text-yellow-300">
                          {output.compile_output}
                        </pre>
                      </div>
                    )}

                    {/* Memory Usage */}
                    {output.memory && (
                      <div className="text-xs text-muted-foreground">
                        Memory: {output.memory} KB
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                    <Terminal className="h-8 w-8 mb-2 opacity-50" />
                    <p className="text-sm text-center">
                      Run your code to see the output here
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
