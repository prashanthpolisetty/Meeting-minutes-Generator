import { useState, useEffect } from 'react';
import { Layers, Clock, FileAudio, Users, TrendingUp } from 'lucide-react';
import UploadWidget from '../components/meetings/UploadWidget';
import { meetingApi } from '../services/api';
import { Link } from 'react-router-dom';

export default function Dashboard() {
  const [stats, setStats] = useState({ total: 0, processing: 0, completed: 0 });
  const [recentMeetings, setRecentMeetings] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => { fetchDashboardData(); }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await meetingApi.getAll();
      const meetings = response.data.meetings || [];
      setStats({
        total: meetings.length,
        processing: meetings.filter((m: any) => m.status === 'pending' || m.status === 'processing').length,
        completed: meetings.filter((m: any) => m.status === 'completed').length,
      });
      setRecentMeetings(meetings.slice(0, 3));
    } catch (error) {
      console.error('Failed to load dashboard data', error);
    } finally {
      setIsLoading(false);
    }
  };

  const statCards = [
    { name: 'Total Meetings Analyzed', value: stats.total,                   icon: FileAudio, color: 'text-brand-600 dark:text-indigo-400', bgColor: 'bg-brand-100 dark:bg-indigo-900/50' },
    { name: 'Processing Currently',    value: stats.processing,              icon: Clock,     color: 'text-amber-600 dark:text-amber-400',  bgColor: 'bg-amber-100 dark:bg-amber-900/40' },
    { name: 'Minutes Generated',       value: stats.completed,               icon: Layers,    color: 'text-green-600 dark:text-green-400',  bgColor: 'bg-green-100 dark:bg-green-900/40' },
    { name: 'Time Saved (Estimated)',  value: `${stats.completed * 45} mins`,icon: TrendingUp,color: 'text-purple-600 dark:text-purple-400',bgColor: 'bg-purple-100 dark:bg-purple-900/40' },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">Overview</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">Welcome to your AI Meeting Minutes dashboard.</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <div key={stat.name}
            className="bg-white dark:bg-gray-800 overflow-hidden rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 transition-colors duration-300">
            <div className="p-5 flex items-center">
              <div className={`p-3 rounded-xl ${stat.bgColor}`}>
                <stat.icon className={`w-6 h-6 ${stat.color}`} />
              </div>
              <div className="ml-5">
                <div className="text-2xl font-bold text-gray-900 dark:text-white leading-tight">
                  {isLoading ? '-' : stat.value}
                </div>
                <div className="text-sm font-medium text-gray-500 dark:text-gray-400 mt-1">{stat.name}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-8 grid-cols-1 lg:grid-cols-3">
        <div className="col-span-1 lg:col-span-2">
          <UploadWidget />
        </div>

        {/* Recent Activity */}
        <div className="col-span-1 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col transition-colors duration-300">
          <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
            <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100">Recent Activity</h3>
            <Link to="/history" className="text-brand-600 dark:text-indigo-400 text-sm font-semibold hover:text-brand-700 dark:hover:text-indigo-300">
              View All
            </Link>
          </div>
          <div className="p-6 flex-1 flex flex-col">
            {isLoading ? (
              <div className="flex-1 flex justify-center items-center">
                <div className="animate-pulse flex space-x-4">
                  <div className="h-4 w-4 bg-gray-200 dark:bg-gray-600 rounded-full" />
                </div>
              </div>
            ) : recentMeetings.length === 0 ? (
              <div className="flex-1 flex flex-col justify-center items-center text-center">
                <div className="w-16 h-16 bg-gray-50 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
                  <Users className="w-8 h-8 text-gray-300 dark:text-gray-500" />
                </div>
                <p className="text-gray-500 dark:text-gray-400 font-medium">No meetings yet</p>
                <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Upload your first audio file to get started.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {recentMeetings.map((meeting) => (
                  <Link to={`/meeting/${meeting._id}`} key={meeting._id} className="block group">
                    <div className="flex items-start">
                      <div className={`mt-0.5 w-2.5 h-2.5 rounded-full shrink-0 ${meeting.status === 'completed' ? 'bg-green-500' : 'bg-amber-400'}`} />
                      <div className="ml-4 flex-1">
                        <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 group-hover:text-brand-600 dark:group-hover:text-indigo-400 transition-colors">
                          {meeting.title}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 capitalize">
                          {meeting.status} • {new Date().toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

