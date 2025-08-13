import { useAuthStore } from '@store/authStore';

function App() {
  const { isAuthenticated, isLoading } = useAuthStore();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gr">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-blue-950">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          PrimePass - Ready for Migration
        </h1>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Authentication Status
          </h2>
          <p className="text-gray-600">
            Authenticated: <span className="font-medium">{isAuthenticated ? 'Yes' : 'No'}</span>
          </p>
          <p className="text-gray-600 mt-2">
            Loading: <span className="font-medium">{isLoading ? 'Yes' : 'No'}</span>
          </p>
        </div>

        <div className="mt-8 bg-blue-100 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-800 mb-2">
            Ready for Migration
          </h3>
          <p className="text-blue-700">
            This is a minimal working React app with Tailwind CSS and Zustand auth store. 
            You can now start migrating your components, pages, and other files manually.
          </p>
        </div>
      </div>
    </div>
  );
}

export default App;
