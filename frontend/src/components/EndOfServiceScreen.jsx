import React from 'react';
import { Github, Code2, ExternalLink } from 'lucide-react';

const EndOfServiceScreen = () => {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center min-h-screen bg-[#0a0a0a] text-white p-4 overflow-hidden">
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] bg-purple-500/10 blur-[120px] rounded-full" />
        <div className="absolute top-[20%] right-[10%] w-[30%] h-[30%] bg-blue-500/10 blur-[100px] rounded-full" />
        <div className="absolute -bottom-[10%] left-[20%] w-[40%] h-[40%] bg-pink-500/10 blur-[120px] rounded-full" />
      </div>

      <div className="relative z-10 max-w-2xl w-full text-center space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-1000">
        
        {/* Main Title Section */}
        <div className="space-y-4">
          <div className="inline-flex items-center justify-center p-3 mb-4 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm">
            <Code2 className="w-8 h-8 text-blue-400" />
          </div>
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400">
            Skill Versus
          </h1>
          <p className="text-2xl md:text-3xl font-medium text-gray-300">
            Has Come to an End
          </p>
        </div>

        {/* Message */}
        <div className="space-y-6 max-w-lg mx-auto">
          <p className="text-gray-400 text-lg leading-relaxed">
            Thank you to everyone who competed, collaborated, and improved their coding skills with us. The servers are now offline, but the journey doesn't end here.
          </p>
          
          <div className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
            <p className="text-gray-300 font-medium mb-4">
              Explore the code, contribute, or deploy it yourself!
            </p>
            <a 
              href="https://github.com/altf4-games/Skill-Versus" 
              target="_blank" 
              rel="noopener noreferrer"
              className="group flex items-center justify-center gap-3 w-full py-4 px-6 rounded-xl bg-white text-black font-bold text-lg hover:bg-gray-200 transition-all duration-300 shadow-lg shadow-white/10 hover:shadow-white/20 transform hover:-translate-y-0.5"
            >
              <Github className="w-6 h-6" />
              <span>View on GitHub</span>
              <ExternalLink className="w-5 h-5 opacity-50 group-hover:opacity-100 transition-opacity" />
            </a>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-12 text-gray-500 text-sm">
          <p>Built with ❤️ by the Skill Versus Team</p>
        </div>
      </div>
    </div>
  );
};

export default EndOfServiceScreen;
