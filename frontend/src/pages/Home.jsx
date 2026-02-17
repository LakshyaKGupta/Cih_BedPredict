/**
 * Landing Page - Premium Healthcare SaaS Design
 * 
 * Professional landing page for hospital bed occupancy prediction system
 * Includes: Hero, Problem, Solution, Features, How It Works, Impact, CTA
 */

import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Heart, 
  Activity, 
  TrendingUp, 
  Users, 
  Clock, 
  AlertCircle,
  BarChart3,
  Shield,
  Zap,
  CheckCircle,
  ArrowRight,
  Hospital,
  Brain,
  LineChart,
  BellRing,
  Database,
  Target
} from 'lucide-react';

const Home = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Intersection Observer for scroll animations
    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animate-fade-in-up');
        }
      });
    }, observerOptions);

    document.querySelectorAll('.scroll-animate').forEach(el => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  const handleGetStarted = () => navigate('/register');
  const handleViewDemo = () => navigate('/login');
  const handleLogin = () => navigate('/login');

  return (
    <div className="bg-white">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-gradient-to-br from-sky-500 to-cyan-600 rounded-xl flex items-center justify-center shadow-lg">
                <Heart className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-sky-600 to-cyan-600 bg-clip-text text-transparent">
                BedPredict AI
              </span>
            </div>

            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-gray-600 hover:text-sky-600 font-medium transition-colors">Features</a>
              <a href="#how-it-works" className="text-gray-600 hover:text-sky-600 font-medium transition-colors">How it Works</a>
              <a href="#impact" className="text-gray-600 hover:text-sky-600 font-medium transition-colors">Impact</a>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleLogin}
                className="px-5 py-2 text-gray-700 hover:text-sky-600 font-medium transition-colors"
              >
                Sign In
              </button>
              <button
                onClick={handleGetStarted}
                className="px-5 py-2 bg-sky-600 text-white rounded-xl hover:bg-sky-700 font-medium transition-all shadow-md hover:shadow-lg"
              >
                Get Started
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 bg-gradient-to-br from-sky-50 via-white to-cyan-50">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-sky-100 text-sky-700 rounded-full text-sm font-medium">
                <Zap className="w-4 h-4" />
                AI-Powered Healthcare Solutions
              </div>
              
              <h1 className="text-5xl lg:text-6xl font-extrabold text-gray-900 leading-tight">
                Predict Hospital Bed Occupancy
                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-sky-600 to-cyan-600 mt-2">
                  7 Days in Advance
                </span>
              </h1>
              
              <p className="text-xl text-gray-600 leading-relaxed">
                Eliminate patient wait times and optimize capacity planning with Facebook Prophet ML. 
                Make data-driven decisions to save lives and improve hospital efficiency.
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={handleGetStarted}
                  className="group px-8 py-4 bg-sky-600 text-white rounded-xl font-semibold hover:bg-sky-700 transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                >
                  Get Started Free
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
                <button
                  onClick={handleViewDemo}
                  className="px-8 py-4 bg-white text-gray-700 border-2 border-gray-200 rounded-xl font-semibold hover:border-sky-600 hover:text-sky-600 transition-all"
                >
                  View Live Demo
                </button>
              </div>

              <div className="flex items-center gap-8 pt-4">
                <div className="flex items-center gap-2 text-gray-600">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span className="font-medium">7-Day Forecast</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span className="font-medium">Real-Time Alerts</span>
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="relative bg-gradient-to-br from-sky-100 to-cyan-100 rounded-3xl p-8 shadow-2xl">
                <div className="bg-white rounded-2xl p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-gray-500">CURRENT STATUS</span>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      <span className="text-sm text-green-600 font-medium">Live</span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gradient-to-br from-sky-50 to-sky-100 rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Hospital className="w-5 h-5 text-sky-600" />
                        <span className="text-xs font-semibold text-gray-500">TOTAL BEDS</span>
                      </div>
                      <div className="text-2xl font-bold text-gray-900">250</div>
                    </div>
                    <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                        <span className="text-xs font-semibold text-gray-500">AVAILABLE</span>
                      </div>
                      <div className="text-2xl font-bold text-gray-900">62</div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-r from-sky-50 to-cyan-50 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-semibold text-gray-700">Current Occupancy</span>
                      <span className="text-2xl font-bold text-sky-600">75%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div className="bg-gradient-to-r from-sky-500 to-cyan-500 h-3 rounded-full" style={{ width: '75%' }}></div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
                    <BellRing className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="font-semibold text-gray-900 mb-1">Forecast Alert</div>
                      <div className="text-sm text-gray-600">Peak occupancy expected: <span className="font-bold text-amber-700">92%</span> (Day 5)</div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-gradient-to-br from-cyan-400 to-sky-500 rounded-full blur-3xl opacity-30"></div>
              <div className="absolute -top-6 -left-6 w-32 h-32 bg-gradient-to-br from-sky-400 to-cyan-400 rounded-full blur-3xl opacity-30"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Problem Section */}
      <section className="py-20 px-4 bg-white scroll-animate">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-sm font-bold text-sky-600 uppercase tracking-wider">The Challenge</span>
            <h2 className="text-4xl font-extrabold text-gray-900 mt-4 mb-6">
              Critical Problems in Healthcare Today
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Hospitals struggle with unpredictable patient flow, leading to overcrowding, long wait times, and compromised care quality.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: Clock,
                title: 'Long Wait Times',
                description: 'Patients wait hours for beds, increasing health risks and dissatisfaction.',
                color: 'from-red-500 to-orange-500'
              },
              {
                icon: Users,
                title: 'Emergency Overflow',
                description: 'Unpredictable surges overwhelm emergency departments and ICU capacity.',
                color: 'from-amber-500 to-yellow-500'
              },
              {
                icon: AlertCircle,
                title: 'Reactive Planning',
                description: 'Hospitals react to crises instead of proactively managing resources.',
                color: 'from-purple-500 to-pink-500'
              }
            ].map((problem, idx) => (
              <div key={idx} className="group bg-gray-50 rounded-2xl p-8 hover:shadow-xl transition-all border border-gray-100 hover:border-gray-200">
                <div className={`w-14 h-14 bg-gradient-to-br ${problem.color} rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                  <problem.icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{problem.title}</h3>
                <p className="text-gray-600 leading-relaxed">{problem.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Solution Section */}
      <section className="py-20 px-4 bg-gradient-to-br from-sky-50 to-cyan-50 scroll-animate">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-sm font-bold text-sky-600 uppercase tracking-wider">Our Solution</span>
            <h2 className="text-4xl font-extrabold text-gray-900 mt-4 mb-6">
              AI-Powered Bed Occupancy Forecasting
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Leverage machine learning to predict bed demand up to 7 days in advance, enabling proactive resource management.
            </p>
          </div>

          <div className="bg-white rounded-3xl shadow-2xl p-12">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <h3 className="text-3xl font-bold text-gray-900 mb-6">Prophet ML Algorithm</h3>
                <div className="space-y-4">
                  {[
                    { icon: Brain, text: 'Facebook Prophet time-series forecasting' },
                    { icon: TrendingUp, text: 'Identifies patterns and seasonal trends' },
                    { icon: Target, text: '95% confidence intervals for predictions' },
                    { icon: Zap, text: 'Real-time updates every 24 hours' }
                  ].map((item, idx) => (
                    <div key={idx} className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-sky-100 rounded-xl flex items-center justify-center flex-shrink-0">
                        <item.icon className="w-6 h-6 text-sky-600" />
                      </div>
                      <span className="text-lg text-gray-700">{item.text}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-gradient-to-br from-sky-50 to-cyan-50 rounded-2xl p-8">
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-gray-500">7-DAY PREDICTION</span>
                    <LineChart className="w-5 h-5 text-sky-600" />
                  </div>
                  
                  {[
                    { day: 'Today', value: 75, color: 'bg-green-500' },
                    { day: 'Day 2', value: 78, color: 'bg-green-500' },
                    { day: 'Day 3', value: 85, color: 'bg-yellow-500' },
                    { day: 'Day 4', value: 89, color: 'bg-yellow-500' },
                    { day: 'Day 5', value: 92, color: 'bg-red-500' },
                    { day: 'Day 6', value: 88, color: 'bg-yellow-500' },
                    { day: 'Day 7', value: 82, color: 'bg-yellow-500' }
                  ].map((pred, idx) => (
                    <div key={idx} className="flex items-center gap-4">
                      <span className="text-sm font-semibold text-gray-600 w-16">{pred.day}</span>
                      <div className="flex-1 bg-gray-200 rounded-full h-3">
                        <div className={`${pred.color} h-3 rounded-full transition-all`} style={{ width: `${pred.value}%` }}></div>
                      </div>
                      <span className="text-sm font-bold text-gray-900 w-12 text-right">{pred.value}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 bg-white scroll-animate">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-sm font-bold text-sky-600 uppercase tracking-wider">Platform Features</span>
            <h2 className="text-4xl font-extrabold text-gray-900 mt-4 mb-6">
              Everything You Need in One Platform
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: Activity, title: '7-Day Forecasts', description: 'Accurate predictions with confidence intervals' },
              { icon: BellRing, title: 'Smart Alerts', description: 'Proactive notifications for capacity risks' },
              { icon: BarChart3, title: 'Analytics Dashboard', description: 'Real-time visualizations and insights' },
              { icon: Database, title: 'EHR Integration', description: 'Seamless data import from hospital systems' },
              { icon: Shield, title: 'HIPAA Compliant', description: 'Enterprise-grade security standards' },
              { icon: Users, title: 'Multi-Hospital', description: 'Manage multiple facilities from one dashboard' },
              { icon: LineChart, title: 'Historical Analysis', description: 'Track patterns and seasonal trends' },
              { icon: Zap, title: 'Fast & Reliable', description: 'Cloud-based with 99.9% uptime' }
            ].map((feature, idx) => (
              <div key={idx} className="group bg-gradient-to-br from-gray-50 to-white rounded-2xl p-6 hover:shadow-lg transition-all border border-gray-100 hover:border-sky-200">
                <div className="w-12 h-12 bg-sky-100 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <feature.icon className="w-6 h-6 text-sky-600" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-sm text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20 px-4 bg-gradient-to-br from-sky-50 to-cyan-50 scroll-animate">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-sm font-bold text-sky-600 uppercase tracking-wider">How It Works</span>
            <h2 className="text-4xl font-extrabold text-gray-900 mt-4 mb-6">
              Simple Process, Powerful Results
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Transform your hospital operations in four simple steps with our AI-powered platform
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-6 items-stretch">
            {[
              { 
                num: '1', 
                title: 'Connect EHR Data', 
                description: 'Securely import admission, discharge, and occupancy records from your existing systems',
                icon: Database,
                features: ['HIPAA compliant', 'Auto-sync every 5 minutes', 'Supports all major EHR systems'],
                color: 'from-blue-500 to-cyan-500'
              },
              { 
                num: '2', 
                title: 'AI Analysis', 
                description: 'Prophet ML analyzes patterns, trends, and seasonality in your historical data',
                icon: Brain,
                features: ['Facebook Prophet algorithm', 'Seasonal pattern detection', 'Anomaly identification'],
                color: 'from-purple-500 to-pink-500'
              },
              { 
                num: '3', 
                title: 'Get Predictions', 
                description: 'Receive 7-day forecasts with 95% confidence intervals and risk assessments',
                icon: TrendingUp,
                features: ['7-day forecasts', '95% confidence intervals', 'Risk level indicators'],
                color: 'from-green-500 to-emerald-500'
              },
              { 
                num: '4', 
                title: 'Optimize Resources', 
                description: 'Proactively manage staffing, bed allocation, and patient flow with data-driven insights',
                icon: CheckCircle,
                features: ['Staff scheduling', 'Bed management', 'Patient flow optimization'],
                color: 'from-orange-500 to-red-500'
              }
            ].map((step, idx) => (
              <div key={idx} className="relative">
                <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all border border-gray-100 h-full flex flex-col">
                  <div className="flex items-start justify-between mb-6">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 bg-gradient-to-br ${step.color} rounded-xl flex items-center justify-center text-white font-bold text-lg`}>
                        {step.num}
                      </div>
                      <step.icon className="w-8 h-8 text-sky-600" />
                    </div>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">{step.title}</h3>
                  <p className="text-gray-600 mb-4">{step.description}</p>
                  
                  {/* Features */}
                  <div className="space-y-2">
                    {step.features.map((feature, featureIdx) => (
                      <div key={featureIdx} className="flex items-center gap-2 text-sm text-gray-600">
                        <div className={`w-1.5 h-1.5 bg-gradient-to-r ${step.color} rounded-full`}></div>
                        {feature}
                      </div>
                    ))}
                  </div>
                </div>
                {idx < 3 && (
                  <ArrowRight className="hidden md:block absolute top-1/2 -right-6 transform -translate-y-1/2 w-6 h-6 text-sky-300" />
                )}
              </div>
            ))}
          </div>
          
          {/* Interactive Demo Button */}
          <div className="text-center mt-16">
            <button
              onClick={handleViewDemo}
              className="group inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-sky-600 to-cyan-600 text-white rounded-2xl font-bold hover:from-sky-700 hover:to-cyan-700 transition-all duration-300 shadow-xl hover:shadow-2xl"
            >
              <span>See It In Action</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
            <p className="text-sm text-gray-500 mt-3">Get a live demo with your hospital's data</p>
          </div>
        </div>
      </section>

      {/* Impact Section */}
      <section id="impact" className="py-20 px-4 bg-white scroll-animate">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-sm font-bold text-sky-600 uppercase tracking-wider">Measurable Impact</span>
            <h2 className="text-4xl font-extrabold text-gray-900 mt-4 mb-6">
              Transform Your Hospital Operations
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { value: '45%', label: 'Reduction in Wait Times', icon: Clock, color: 'from-green-500 to-emerald-500' },
              { value: '30%', label: 'Improved Bed Utilization', icon: TrendingUp, color: 'from-blue-500 to-cyan-500' },
              { value: '60%', label: 'Better Resource Planning', icon: Target, color: 'from-purple-500 to-pink-500' }
            ].map((stat, idx) => (
              <div key={idx} className="bg-gradient-to-br from-gray-50 to-white rounded-2xl p-8 text-center shadow-lg hover:shadow-xl transition-all border border-gray-100">
                <div className={`w-16 h-16 bg-gradient-to-br ${stat.color} rounded-2xl flex items-center justify-center mx-auto mb-6`}>
                  <stat.icon className="w-8 h-8 text-white" />
                </div>
                <div className="text-5xl font-extrabold text-gray-900 mb-3">{stat.value}</div>
                <div className="text-lg text-gray-600 font-semibold">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-gradient-to-br from-sky-600 to-cyan-600 scroll-animate">
        <div className="max-w-4xl mx-auto text-center text-white">
          <h2 className="text-4xl md:text-5xl font-extrabold mb-6">
            Ready to Transform Patient Care?
          </h2>
          <p className="text-xl mb-10 text-sky-100">
            Join leading hospitals using AI to predict bed occupancy and optimize resource allocation.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={handleGetStarted}
              className="group px-10 py-4 bg-white text-sky-600 rounded-xl font-bold hover:bg-gray-100 transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2 text-lg"
            >
              Start Free Trial
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
            <button
              onClick={handleViewDemo}
              className="px-10 py-4 bg-sky-500 text-white border-2 border-white/30 rounded-xl font-bold hover:bg-sky-400 transition-all text-lg"
            >
              Schedule Demo
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-6 md:mb-0">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-10 h-10 bg-gradient-to-br from-sky-500 to-cyan-600 rounded-xl flex items-center justify-center">
                  <Heart className="w-6 h-6 text-white" />
                </div>
                <span className="text-xl font-bold text-white">BedPredict AI</span>
              </div>
              <p className="text-sm">AI-Powered Hospital Bed Occupancy Prediction</p>
              <p className="text-sm text-gray-500 mt-2">SDG 3.14 - Healthcare Innovation</p>
            </div>
            <div className="text-center md:text-right">
              <p className="text-sm">&copy; 2026 BedPredict AI. All rights reserved.</p>
              <p className="text-xs text-gray-500 mt-1">Hackathon Project - Demo Version</p>
            </div>
          </div>
        </div>
      </footer>

      <style>{`
        .scroll-animate {
          opacity: 0;
          transform: translateY(20px);
        }
        
        .animate-fade-in-up {
          animation: fadeInUp 0.6s ease-out forwards;
        }
        
        @keyframes fadeInUp {
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
};

export default Home;
