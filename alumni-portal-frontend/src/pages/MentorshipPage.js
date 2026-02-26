import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { MessageCircle, Users, Calendar, Plus, Filter } from 'lucide-react';
import DashboardLayout from '../components/layout/DashboardLayout';

const MentorshipPage = () => {
  const [activeTab, setActiveTab] = useState('requests');

  const tabs = [
    { id: 'requests', name: 'My Requests', icon: MessageCircle },
    { id: 'mentoring', name: 'Mentoring', icon: Users },
    { id: 'find', name: 'Find Mentors', icon: Users },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Mentorship</h1>
            <p className="mt-1 text-sm text-gray-500">
              Connect with mentors and guide fellow students
            </p>
          </div>
          <div className="mt-4 sm:mt-0">
            <button className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700">
              <Plus className="h-4 w-4 mr-2" />
              New Request
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white shadow rounded-lg">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 px-6">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`${
                      activeTab === tab.id
                        ? 'border-primary-500 text-primary-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
                  >
                    <Icon className="h-4 w-4 mr-2" />
                    {tab.name}
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'requests' && (
              <div className="text-center py-12">
                <MessageCircle className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No mentorship requests</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Start by finding a mentor who matches your career goals.
                </p>
              </div>
            )}

            {activeTab === 'mentoring' && (
              <div className="text-center py-12">
                <Users className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No mentees yet</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Students will reach out when they need your expertise.
                </p>
              </div>
            )}

            {activeTab === 'find' && (
              <div>
                <div className="mb-6">
                  <div className="flex items-center space-x-4">
                    <div className="flex-1">
                      <input
                        type="text"
                        placeholder="Search mentors by skills, company, or industry..."
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                      />
                    </div>
                    <button className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
                      <Filter className="h-4 w-4 mr-2" />
                      Filters
                    </button>
                  </div>
                </div>

                <div className="text-center py-12">
                  <Users className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No mentors found</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Try adjusting your search criteria to find mentors.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default MentorshipPage;