import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUserContext } from '../contexts/UserContext';
import { SEO } from '../components/SEO';
import { API_ENDPOINTS } from '../config/api';

const CreateContestPage = () => {
  const navigate = useNavigate();
  const { user, getToken } = useUserContext();
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    startTime: '',
    duration: 120, // minutes
    maxParticipants: '',
    isPublic: true,
    allowVirtualParticipation: true,
    penaltyPerWrongSubmission: 20,
    maxSubmissionsPerProblem: 50,
  });
  
  const [problems, setProblems] = useState([]);
  const [selectedProblems, setSelectedProblems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    // Check if user is contest admin
    if (!user?.contestAdmin) {
      navigate('/contests');
      return;
    }
    
    fetchProblems();
  }, [user, navigate]);

  const fetchProblems = async () => {
    try {
      const response = await fetch(`${API_ENDPOINTS.problems}?includeContestOnly=true`, {
        headers: {
          'Authorization': `Bearer ${await getToken()}`,
        },
      });
      const data = await response.json();

      if (response.ok) {
        setProblems(data.problems || []);
      } else {
        setError('Failed to fetch problems');
      }
    } catch (err) {
      setError('Failed to fetch problems');
      console.error('Fetch problems error:', err);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleProblemToggle = (problemId) => {
    setSelectedProblems(prev => {
      const existing = prev.find(p => p.problemId === problemId);
      if (existing) {
        return prev.filter(p => p.problemId !== problemId);
      } else {
        return [...prev, {
          problemId,
          points: 100,
          order: prev.length + 1
        }];
      }
    });
  };

  const handleProblemPointsChange = (problemId, points) => {
    setSelectedProblems(prev =>
      prev.map(p =>
        p.problemId === problemId ? { ...p, points: parseInt(points) || 0 } : p
      )
    );
  };

  const handleProblemOrderChange = (problemId, order) => {
    setSelectedProblems(prev =>
      prev.map(p =>
        p.problemId === problemId ? { ...p, order: parseInt(order) || 1 } : p
      )
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (selectedProblems.length === 0) {
      setError('Please select at least one problem');
      return;
    }

    // Validate start time
    const startTime = new Date(formData.startTime);
    if (startTime <= new Date()) {
      setError('Start time must be in the future');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const response = await fetch(API_ENDPOINTS.contests, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${await getToken()}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          maxParticipants: formData.maxParticipants ? parseInt(formData.maxParticipants) : null,
          problems: selectedProblems,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess('Contest created successfully!');
        setTimeout(() => {
          navigate(`/contests/${data.contest.id}`);
        }, 2000);
      } else {
        setError(data.error || 'Failed to create contest');
      }
    } catch (err) {
      setError('Failed to create contest');
      console.error('Create contest error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Generate default start time (1 hour from now)
  const getDefaultStartTime = () => {
    const now = new Date();
    now.setHours(now.getHours() + 1);
    return now.toISOString().slice(0, 16);
  };

  if (!user?.contestAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <SEO title="Create Contest" description="Create a new competitive programming contest" />
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Create Contest
            </h1>
            <p className="text-muted-foreground">
              Set up a new competitive programming contest
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
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Basic Information */}
            <div className="bg-card rounded-lg shadow-sm border border-border p-6">
              <h2 className="text-xl font-semibold text-foreground mb-4">
                Basic Information
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Contest Title *
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground focus:ring-2 focus:ring-ring focus:border-transparent"
                    placeholder="Enter contest title"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Start Time *
                  </label>
                  <input
                    type="datetime-local"
                    name="startTime"
                    value={formData.startTime || getDefaultStartTime()}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground focus:ring-2 focus:ring-ring focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Duration (minutes) *
                  </label>
                  <input
                    type="number"
                    name="duration"
                    value={formData.duration}
                    onChange={handleInputChange}
                    required
                    min="30"
                    max="300"
                    className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground focus:ring-2 focus:ring-ring focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Max Participants
                  </label>
                  <input
                    type="number"
                    name="maxParticipants"
                    value={formData.maxParticipants}
                    onChange={handleInputChange}
                    min="1"
                    className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground focus:ring-2 focus:ring-ring focus:border-transparent"
                    placeholder="Leave empty for unlimited"
                  />
                </div>
              </div>

              <div className="mt-6">
                <label className="block text-sm font-medium text-foreground mb-2">
                  Description *
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  required
                  rows="4"
                  className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground focus:ring-2 focus:ring-ring focus:border-transparent"
                  placeholder="Describe the contest..."
                />
              </div>
            </div>

            {/* Contest Settings */}
            <div className="bg-card rounded-lg shadow-sm border border-border p-6">
              <h2 className="text-xl font-semibold text-foreground mb-4">
                Contest Settings
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Penalty per Wrong Submission (minutes)
                  </label>
                  <input
                    type="number"
                    name="penaltyPerWrongSubmission"
                    value={formData.penaltyPerWrongSubmission}
                    onChange={handleInputChange}
                    min="0"
                    className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground focus:ring-2 focus:ring-ring focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Max Submissions per Problem
                  </label>
                  <input
                    type="number"
                    name="maxSubmissionsPerProblem"
                    value={formData.maxSubmissionsPerProblem}
                    onChange={handleInputChange}
                    min="1"
                    className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground focus:ring-2 focus:ring-ring focus:border-transparent"
                  />
                </div>
              </div>

              <div className="mt-6 space-y-4">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    name="isPublic"
                    checked={formData.isPublic}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-primary focus:ring-ring border-input rounded"
                  />
                  <label className="ml-2 text-sm text-foreground">
                    Public contest (visible to all users)
                  </label>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    name="allowVirtualParticipation"
                    checked={formData.allowVirtualParticipation}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-primary focus:ring-ring border-input rounded"
                  />
                  <label className="ml-2 text-sm text-foreground">
                    Allow virtual participation after contest ends
                  </label>
                </div>
              </div>
            </div>

            {/* Problem Selection */}
            <div className="bg-card rounded-lg shadow-sm border border-border p-6">
              <h2 className="text-xl font-semibold text-foreground mb-4">
                Select Problems
              </h2>

              {problems.length === 0 ? (
                <p className="text-muted-foreground">No problems available</p>
              ) : (
                <div className="space-y-4">
                  {problems.map((problem) => {
                    const isSelected = selectedProblems.some(p => p.problemId === problem._id);
                    const selectedProblem = selectedProblems.find(p => p.problemId === problem._id);
                    
                    return (
                      <div
                        key={problem._id}
                        className={`border rounded-lg p-4 ${
                          isSelected
                            ? 'border-primary bg-primary/10'
                            : 'border-border'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-start space-x-3">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleProblemToggle(problem._id)}
                              className="mt-1 h-4 w-4 text-primary focus:ring-ring border-input rounded"
                            />
                            <div>
                              <h3 className="font-medium text-foreground">
                                {problem.title}
                              </h3>
                              <p className="text-sm text-muted-foreground mt-1">
                                Difficulty: {problem.difficulty}
                              </p>
                            </div>
                          </div>
                          
                          {isSelected && (
                            <div className="flex space-x-2">
                              <div>
                                <label className="block text-xs text-muted-foreground mb-1">
                                  Points
                                </label>
                                <input
                                  type="number"
                                  value={selectedProblem?.points || 100}
                                  onChange={(e) => handleProblemPointsChange(problem._id, e.target.value)}
                                  min="1"
                                  max="1000"
                                  className="w-20 px-2 py-1 text-sm border border-input rounded bg-background text-foreground"
                                />
                              </div>
                              <div>
                                <label className="block text-xs text-muted-foreground mb-1">
                                  Order
                                </label>
                                <input
                                  type="number"
                                  value={selectedProblem?.order || 1}
                                  onChange={(e) => handleProblemOrderChange(problem._id, e.target.value)}
                                  min="1"
                                  className="w-20 px-2 py-1 text-sm border border-input rounded bg-background text-foreground"
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Submit Button */}
            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => navigate('/contests')}
                className="px-6 py-2 border border-input text-foreground rounded-lg hover:bg-accent hover:text-accent-foreground transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || selectedProblems.length === 0}
                className="px-6 py-2 bg-primary hover:bg-primary/90 disabled:bg-muted text-primary-foreground rounded-lg font-medium transition-colors"
              >
                {loading ? 'Creating...' : 'Create Contest'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateContestPage;
