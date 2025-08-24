import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUserContext } from '../contexts/UserContext';
import { SEO } from '../components/SEO';
import { API_ENDPOINTS } from '../config/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Trash2, Code, TestTube, FileText, Settings } from 'lucide-react';

const CreateProblemPage = () => {
  const navigate = useNavigate();
  const { user, getToken } = useUserContext();
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    difficulty: 'Easy',
    timeLimit: 2000,
    memoryLimit: 256,
    tags: [],
    isContestOnly: false,
    examples: [{ input: '', output: '', explanation: '' }],
    testCases: [{ input: '', output: '', isHidden: false }],
    functionSignatures: {
      javascript: '',
      python: '',
      java: '',
      cpp: '',
      c: ''
    },
    driverCode: {
      javascript: '',
      python: '',
      java: '',
      cpp: '',
      c: ''
    }
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [newTag, setNewTag] = useState('');

  useEffect(() => {
    // Check if user is contest admin
    if (!user?.contestAdmin) {
      navigate('/dashboard');
      return;
    }
  }, [user, navigate]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleFunctionSignatureChange = (language, value) => {
    setFormData(prev => ({
      ...prev,
      functionSignatures: {
        ...prev.functionSignatures,
        [language]: value
      }
    }));
  };

  const handleDriverCodeChange = (language, value) => {
    setFormData(prev => ({
      ...prev,
      driverCode: {
        ...prev.driverCode,
        [language]: value
      }
    }));
  };

  const addTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }));
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const addExample = () => {
    setFormData(prev => ({
      ...prev,
      examples: [...prev.examples, { input: '', output: '', explanation: '' }]
    }));
  };

  const removeExample = (index) => {
    setFormData(prev => ({
      ...prev,
      examples: prev.examples.filter((_, i) => i !== index)
    }));
  };

  const updateExample = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      examples: prev.examples.map((example, i) => 
        i === index ? { ...example, [field]: value } : example
      )
    }));
  };

  const addTestCase = () => {
    setFormData(prev => ({
      ...prev,
      testCases: [...prev.testCases, { input: '', output: '', isHidden: false }]
    }));
  };

  const removeTestCase = (index) => {
    setFormData(prev => ({
      ...prev,
      testCases: prev.testCases.filter((_, i) => i !== index)
    }));
  };

  const updateTestCase = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      testCases: prev.testCases.map((testCase, i) => 
        i === index ? { ...testCase, [field]: value } : testCase
      )
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.examples.length === 0) {
      setError('Please add at least one example');
      return;
    }

    if (formData.testCases.length === 0) {
      setError('Please add at least one test case');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const response = await fetch(API_ENDPOINTS.problems, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${await getToken()}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess('Problem created successfully!');
        setTimeout(() => {
          navigate('/dashboard');
        }, 2000);
      } else {
        setError(data.error || 'Failed to create problem');
      }
    } catch (err) {
      setError('Failed to create problem');
      console.error('Create problem error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!user?.contestAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <SEO title="Create Problem" description="Create a new competitive programming problem" />
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Create Problem
            </h1>
            <p className="text-muted-foreground">
              Create a new competitive programming problem for contests and practice
            </p>
          </div>

          {/* Messages */}
          {error && (
            <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-lg mb-6">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-500/10 border border-green-500/20 text-green-600 dark:text-green-400 px-4 py-3 rounded-lg mb-6">
              {success}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit}>
            <Tabs defaultValue="basic" className="space-y-6">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="basic" className="flex items-center space-x-2">
                  <FileText className="h-4 w-4" />
                  <span>Basic Info</span>
                </TabsTrigger>
                <TabsTrigger value="examples" className="flex items-center space-x-2">
                  <TestTube className="h-4 w-4" />
                  <span>Examples</span>
                </TabsTrigger>
                <TabsTrigger value="testcases" className="flex items-center space-x-2">
                  <Settings className="h-4 w-4" />
                  <span>Test Cases</span>
                </TabsTrigger>
                <TabsTrigger value="code" className="flex items-center space-x-2">
                  <Code className="h-4 w-4" />
                  <span>Code Templates</span>
                </TabsTrigger>
              </TabsList>

              {/* Basic Information Tab */}
              <TabsContent value="basic">
                <Card>
                  <CardHeader>
                    <CardTitle>Basic Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                          Problem Title *
                        </label>
                        <input
                          type="text"
                          name="title"
                          value={formData.title}
                          onChange={handleInputChange}
                          required
                          className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground focus:ring-2 focus:ring-ring focus:border-transparent"
                          placeholder="Enter problem title"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                          Difficulty *
                        </label>
                        <select
                          name="difficulty"
                          value={formData.difficulty}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground focus:ring-2 focus:ring-ring focus:border-transparent"
                        >
                          <option value="Easy">Easy</option>
                          <option value="Medium">Medium</option>
                          <option value="Hard">Hard</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                          Time Limit (ms)
                        </label>
                        <input
                          type="number"
                          name="timeLimit"
                          value={formData.timeLimit}
                          onChange={handleInputChange}
                          min="1000"
                          max="10000"
                          className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground focus:ring-2 focus:ring-ring focus:border-transparent"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                          Memory Limit (MB)
                        </label>
                        <input
                          type="number"
                          name="memoryLimit"
                          value={formData.memoryLimit}
                          onChange={handleInputChange}
                          min="64"
                          max="1024"
                          className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground focus:ring-2 focus:ring-ring focus:border-transparent"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Problem Description *
                      </label>
                      <textarea
                        name="description"
                        value={formData.description}
                        onChange={handleInputChange}
                        required
                        rows="8"
                        className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground focus:ring-2 focus:ring-ring focus:border-transparent"
                        placeholder="Describe the problem in detail..."
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Tags
                      </label>
                      <div className="flex space-x-2 mb-2">
                        <input
                          type="text"
                          value={newTag}
                          onChange={(e) => setNewTag(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                          className="flex-1 px-3 py-2 border border-input rounded-lg bg-background text-foreground focus:ring-2 focus:ring-ring focus:border-transparent"
                          placeholder="Add a tag"
                        />
                        <Button type="button" onClick={addTag} variant="outline">
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {formData.tags.map((tag, index) => (
                          <Badge key={index} variant="secondary" className="flex items-center space-x-1">
                            <span>{tag}</span>
                            <button
                              type="button"
                              onClick={() => removeTag(tag)}
                              className="ml-1 hover:text-destructive"
                            >
                              ×
                            </button>
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          name="isContestOnly"
                          checked={formData.isContestOnly}
                          onChange={handleInputChange}
                          className="h-4 w-4 text-primary focus:ring-ring border-input rounded"
                        />
                        <span className="text-sm text-foreground">Contest Only Problem</span>
                      </label>
                      <p className="text-xs text-muted-foreground mt-1">
                        If checked, this problem will only appear in contests and not in duels or practice mode.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Examples Tab */}
              <TabsContent value="examples">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>Examples</span>
                      <Button type="button" onClick={addExample} variant="outline" size="sm">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Example
                      </Button>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {formData.examples.map((example, index) => (
                      <div key={index} className="border border-border rounded-lg p-4">
                        <div className="flex justify-between items-center mb-4">
                          <h4 className="font-medium">Example {index + 1}</h4>
                          {formData.examples.length > 1 && (
                            <Button
                              type="button"
                              onClick={() => removeExample(index)}
                              variant="outline"
                              size="sm"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-foreground mb-2">
                              Input
                            </label>
                            <textarea
                              value={example.input}
                              onChange={(e) => updateExample(index, 'input', e.target.value)}
                              rows="3"
                              className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground focus:ring-2 focus:ring-ring focus:border-transparent font-mono text-sm"
                              placeholder="Example input"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-foreground mb-2">
                              Output
                            </label>
                            <textarea
                              value={example.output}
                              onChange={(e) => updateExample(index, 'output', e.target.value)}
                              rows="3"
                              className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground focus:ring-2 focus:ring-ring focus:border-transparent font-mono text-sm"
                              placeholder="Expected output"
                            />
                          </div>
                        </div>
                        <div className="mt-4">
                          <label className="block text-sm font-medium text-foreground mb-2">
                            Explanation (optional)
                          </label>
                          <textarea
                            value={example.explanation}
                            onChange={(e) => updateExample(index, 'explanation', e.target.value)}
                            rows="2"
                            className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground focus:ring-2 focus:ring-ring focus:border-transparent"
                            placeholder="Explain the example"
                          />
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Test Cases Tab */}
              <TabsContent value="testcases">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>Test Cases</span>
                      <Button type="button" onClick={addTestCase} variant="outline" size="sm">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Test Case
                      </Button>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {formData.testCases.map((testCase, index) => (
                      <div key={index} className="border border-border rounded-lg p-4">
                        <div className="flex justify-between items-center mb-4">
                          <h4 className="font-medium">Test Case {index + 1}</h4>
                          <div className="flex items-center space-x-2">
                            <label className="flex items-center space-x-2">
                              <input
                                type="checkbox"
                                checked={testCase.isHidden}
                                onChange={(e) => updateTestCase(index, 'isHidden', e.target.checked)}
                                className="rounded border-input"
                              />
                              <span className="text-sm">Hidden</span>
                            </label>
                            {formData.testCases.length > 1 && (
                              <Button
                                type="button"
                                onClick={() => removeTestCase(index)}
                                variant="outline"
                                size="sm"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-foreground mb-2">
                              Input
                            </label>
                            <textarea
                              value={testCase.input}
                              onChange={(e) => updateTestCase(index, 'input', e.target.value)}
                              rows="4"
                              className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground focus:ring-2 focus:ring-ring focus:border-transparent font-mono text-sm"
                              placeholder="Test case input"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-foreground mb-2">
                              Expected Output
                            </label>
                            <textarea
                              value={testCase.output}
                              onChange={(e) => updateTestCase(index, 'output', e.target.value)}
                              rows="4"
                              className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground focus:ring-2 focus:ring-ring focus:border-transparent font-mono text-sm"
                              placeholder="Expected output"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Code Templates Tab */}
              <TabsContent value="code">
                <Card>
                  <CardHeader>
                    <CardTitle>Code Templates</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <Tabs defaultValue="javascript" className="w-full">
                      <TabsList className="grid w-full grid-cols-5">
                        <TabsTrigger value="javascript">JavaScript</TabsTrigger>
                        <TabsTrigger value="python">Python</TabsTrigger>
                        <TabsTrigger value="java">Java</TabsTrigger>
                        <TabsTrigger value="cpp">C++</TabsTrigger>
                        <TabsTrigger value="c">C</TabsTrigger>
                      </TabsList>

                      {['javascript', 'python', 'java', 'cpp', 'c'].map(language => (
                        <TabsContent key={language} value={language} className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-foreground mb-2">
                              Function Signature
                            </label>
                            <textarea
                              value={formData.functionSignatures[language]}
                              onChange={(e) => handleFunctionSignatureChange(language, e.target.value)}
                              rows="6"
                              className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground focus:ring-2 focus:ring-ring focus:border-transparent font-mono text-sm"
                              placeholder={`Enter ${language} function signature...`}
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-foreground mb-2">
                              Driver Code (optional)
                            </label>
                            <textarea
                              value={formData.driverCode[language]}
                              onChange={(e) => handleDriverCodeChange(language, e.target.value)}
                              rows="8"
                              className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground focus:ring-2 focus:ring-ring focus:border-transparent font-mono text-sm"
                              placeholder={`Enter ${language} driver code for automatic testing...`}
                            />
                          </div>
                        </TabsContent>
                      ))}
                    </Tabs>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Submit Button */}
              <div className="flex justify-end space-x-4">
                <Button
                  type="button"
                  onClick={() => navigate('/dashboard')}
                  variant="outline"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={loading}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  {loading ? 'Creating...' : 'Create Problem'}
                </Button>
              </div>
            </Tabs>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateProblemPage;
