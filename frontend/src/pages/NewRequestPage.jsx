import React, { useState } from 'react';
import ServiceRequestForm from '../components/requests/ServiceRequestForm';
import { ArrowLeft, MapPin, Clock, Settings, Wrench, Shield, Star, Sun, Moon, Zap, CheckCircle, Users, Award } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout/Layout';

const NewRequestPage = () => {
  const navigate = useNavigate();
  const [theme, setTheme] = useState('light');

  const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');

  // Theme styles
  const themeStyles = {
    light: {
      bg: 'bg-gray-50',
      cardBg: 'bg-white',
      headerText: 'text-gray-900',
      bodyText: 'text-gray-700',
      mutedText: 'text-gray-500',
      border: 'border-gray-200',
      hoverBorder: 'hover:border-blue-300',
      hoverShadow: 'hover:shadow-lg',
      inputBg: 'bg-white border-gray-300',
      cardHover: 'hover:bg-gray-50',
      accent: 'bg-blue-50',
      accentBorder: 'border-blue-200',
      accentText: 'text-blue-900'
    },
    dark: {
      bg: 'bg-gray-900',
      cardBg: 'bg-gray-800',
      headerText: 'text-white',
      bodyText: 'text-gray-200',
      mutedText: 'text-gray-400',
      border: 'border-gray-700',
      hoverBorder: 'hover:border-blue-500',
      hoverShadow: 'hover:shadow-2xl',
      inputBg: 'bg-gray-700 border-gray-600 text-white',
      cardHover: 'hover:bg-gray-700',
      accent: 'bg-blue-900/30',
      accentBorder: 'border-blue-700',
      accentText: 'text-blue-300'
    }
  };

  const styles = themeStyles[theme];

  return (
    <Layout>
      <div className={`${styles.bg} min-h-screen transition-all duration-300`}>
        {/* Theme Toggle Button */}
        <div className="fixed top-6 left-6 z-50">
          <button
            onClick={toggleTheme}
            className={`p-4 ${styles.cardBg} ${styles.border} border-2 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-110`}
          >
            {theme === 'light' ? 
              <Moon size={24} className="text-gray-700" /> : 
              <Sun size={24} className="text-yellow-400" />
            }
          </button>
        </div>

        <div className="max-w-6xl mx-auto py-10 px-6">
          {/* Header */}
          <div className="flex items-center mb-10">
            <button 
              onClick={() => navigate(-1)} 
              className={`p-4 rounded-full ${styles.cardHover} mr-6 transition-all duration-200 hover:shadow-lg transform hover:-translate-x-2 hover:scale-110 ${styles.border} border-2`}
            >
              <ArrowLeft size={28} className={`${styles.bodyText}`} />
            </button>
            <div>
              <h1 className={`text-5xl font-black ${styles.headerText} hover:text-blue-600 transition-colors cursor-pointer`}>
                New Service Request
              </h1>
              <p className={`${styles.bodyText} mt-3 text-xl font-bold`}>
                Get professional help for your vehicle with our expert mechanics
              </p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            {/* Main Form */}
            <div className="lg:col-span-2">
              <div className={`${styles.cardBg} rounded-2xl shadow-xl border-2 ${styles.border} ${styles.hoverShadow} transition-all duration-300`}>
                <div className={`p-8 border-b-2 ${styles.border}`}>
                  <h2 className={`text-2xl font-black ${styles.headerText} flex items-center gap-3`}>
                    <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full animate-pulse">
                      <Wrench size={24} className="text-white" />
                    </div>
                    Service Request Details
                  </h2>
                  <p className={`text-base ${styles.mutedText} mt-2 font-semibold`}>
                    Fill out the details below to find the nearest professional help.
                  </p>
                </div>
                <div className="p-8">
                  <ServiceRequestForm theme={theme} />
                </div>
              </div>
            </div>

            {/* Sidebar Info */}
            <div className="lg:col-span-1 space-y-8">
              {/* How it Works */}
              <div className={`${styles.cardBg} rounded-2xl shadow-xl border-2 ${styles.border} p-8 ${styles.hoverShadow} transition-all duration-300 ${styles.hoverBorder}`}>
                <h3 className={`text-xl font-black ${styles.headerText} mb-6 flex items-center gap-3`}>
                  <div className="p-2 bg-gradient-to-r from-green-500 to-teal-600 rounded-full animate-pulse">
                    <Settings size={20} className="text-white" />
                  </div>
                  How It Works
                </h3>
                <div className="space-y-6">
                  <div className="flex items-start gap-4 group cursor-pointer">
                    <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-full flex items-center justify-center text-base font-black group-hover:scale-125 transition-transform duration-200 animate-pulse">
                      1
                    </div>
                    <div>
                      <p className={`font-bold text-lg ${styles.headerText} group-hover:text-blue-600 transition-colors`}>
                        Submit Request
                      </p>
                      <p className={`text-base ${styles.bodyText} font-medium`}>
                        Fill in your vehicle and service details with precision
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4 group cursor-pointer">
                    <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-full flex items-center justify-center text-base font-black group-hover:scale-125 transition-transform duration-200 animate-pulse">
                      2
                    </div>
                    <div>
                      <p className={`font-bold text-lg ${styles.headerText} group-hover:text-green-600 transition-colors`}>
                        Get Matched
                      </p>
                      <p className={`text-base ${styles.bodyText} font-medium`}>
                        We'll find nearby qualified and verified mechanics
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4 group cursor-pointer">
                    <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-full flex items-center justify-center text-base font-black group-hover:scale-125 transition-transform duration-200 animate-pulse">
                      3
                    </div>
                    <div>
                      <p className={`font-bold text-lg ${styles.headerText} group-hover:text-purple-600 transition-colors`}>
                        Get Service
                      </p>
                      <p className={`text-base ${styles.bodyText} font-medium`}>
                        Expert mechanic contacts you and provides quality service
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Service Features */}
              <div className={`${styles.cardBg} rounded-2xl shadow-xl border-2 ${styles.border} p-8 ${styles.hoverShadow} transition-all duration-300 hover:border-green-400`}>
                <h3 className={`text-xl font-black ${styles.headerText} mb-6 flex items-center gap-3`}>
                  <div className="p-2 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full animate-pulse">
                    <Shield size={20} className="text-white" />
                  </div>
                  Why Choose Us
                </h3>
                <div className="space-y-4">
                  <div className={`flex items-center gap-3 text-base ${styles.bodyText} hover:text-green-600 transition-colors cursor-pointer p-2 rounded-lg hover:bg-green-50 dark:hover:bg-green-900/20`}>
                    <div className="w-3 h-3 bg-gradient-to-r from-green-400 to-green-600 rounded-full animate-pulse"></div>
                    <span className="font-bold">Verified and experienced mechanics</span>
                  </div>
                  <div className={`flex items-center gap-3 text-base ${styles.bodyText} hover:text-blue-600 transition-colors cursor-pointer p-2 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20`}>
                    <div className="w-3 h-3 bg-gradient-to-r from-blue-400 to-blue-600 rounded-full animate-pulse"></div>
                    <span className="font-bold">Lightning-fast response time</span>
                  </div>
                  <div className={`flex items-center gap-3 text-base ${styles.bodyText} hover:text-yellow-600 transition-colors cursor-pointer p-2 rounded-lg hover:bg-yellow-50 dark:hover:bg-yellow-900/20`}>
                    <div className="w-3 h-3 bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-full animate-pulse"></div>
                    <span className="font-bold">Transparent and fair pricing</span>
                  </div>
                  <div className={`flex items-center gap-3 text-base ${styles.bodyText} hover:text-purple-600 transition-colors cursor-pointer p-2 rounded-lg hover:bg-purple-50 dark:hover:bg-purple-900/20`}>
                    <div className="w-3 h-3 bg-gradient-to-r from-purple-400 to-purple-600 rounded-full animate-pulse"></div>
                    <span className="font-bold">24/7 customer support available</span>
                  </div>
                  <div className={`flex items-center gap-3 text-base ${styles.bodyText} hover:text-indigo-600 transition-colors cursor-pointer p-2 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-900/20`}>
                    <div className="w-3 h-3 bg-gradient-to-r from-indigo-400 to-indigo-600 rounded-full animate-pulse"></div>
                    <span className="font-bold">100% service quality guarantee</span>
                  </div>
                </div>
              </div>

              {/* Quick Tips */}
              <div className={`${styles.accent} rounded-2xl border-2 ${styles.accentBorder} p-8 ${styles.cardHover} transition-all duration-300 hover:shadow-xl`}>
                <h3 className={`text-xl font-black ${styles.accentText} mb-6 flex items-center gap-3`}>
                  <div className="p-2 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full animate-pulse">
                    <Star size={20} className="text-white" />
                  </div>
                  Pro Tips
                </h3>
                <ul className="space-y-4">
                  <li className={`flex items-start gap-3 text-base ${styles.accentText} font-semibold`}>
                    <div className="w-2 h-2 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full mt-2 animate-pulse"></div>
                    <span>Be as detailed as possible about the vehicle issue</span>
                  </li>
                  <li className={`flex items-start gap-3 text-base ${styles.accentText} font-semibold`}>
                    <div className="w-2 h-2 bg-gradient-to-r from-green-500 to-green-600 rounded-full mt-2 animate-pulse"></div>
                    <span>Provide accurate location for lightning-fast service</span>
                  </li>
                  <li className={`flex items-start gap-3 text-base ${styles.accentText} font-semibold`}>
                    <div className="w-2 h-2 bg-gradient-to-r from-purple-500 to-purple-600 rounded-full mt-2 animate-pulse"></div>
                    <span>Include complete vehicle details for better diagnosis</span>
                  </li>
                  <li className={`flex items-start gap-3 text-base ${styles.accentText} font-semibold`}>
                    <div className="w-2 h-2 bg-gradient-to-r from-orange-500 to-orange-600 rounded-full mt-2 animate-pulse"></div>
                    <span>Select preferred time for maximum flexibility</span>
                  </li>
                </ul>
              </div>

              {/* Statistics Card */}
              {/* <div className={`${styles.cardBg} rounded-2xl shadow-xl border-2 ${styles.border} p-8 ${styles.hoverShadow} transition-all duration-300 hover:border-blue-400`}>
                <h3 className={`text-xl font-black ${styles.headerText} mb-6 flex items-center gap-3`}>
                  <div className="p-2 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full animate-pulse">
                    <Award size={20} className="text-white" />
                  </div>
                  Our Track Record
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 hover:shadow-lg transition-all duration-200 cursor-pointer">
                    <div className={`text-2xl font-black ${styles.headerText} hover:text-blue-600 transition-colors`}>10K+</div>
                    <div className={`text-sm font-bold ${styles.mutedText}`}>Happy Customers</div>
                  </div>
                  <div className="text-center p-4 rounded-xl bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-800/30 hover:shadow-lg transition-all duration-200 cursor-pointer">
                    <div className={`text-2xl font-black ${styles.headerText} hover:text-green-600 transition-colors`}>500+</div>
                    <div className={`text-sm font-bold ${styles.mutedText}`}>Expert Mechanics</div>
                  </div>
                  <div className="text-center p-4 rounded-xl bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/30 dark:to-yellow-800/30 hover:shadow-lg transition-all duration-200 cursor-pointer">
                    <div className={`text-2xl font-black ${styles.headerText} hover:text-yellow-600 transition-colors`}>15min</div>
                    <div className={`text-sm font-bold ${styles.mutedText}`}>Avg Response</div>
                  </div>
                  <div className="text-center p-4 rounded-xl bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/30 dark:to-purple-800/30 hover:shadow-lg transition-all duration-200 cursor-pointer">
                    <div className={`text-2xl font-black ${styles.headerText} hover:text-purple-600 transition-colors`}>4.9★</div>
                    <div className={`text-sm font-bold ${styles.mutedText}`}>Customer Rating</div>
                  </div>
                </div>
              </div> */}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default NewRequestPage;