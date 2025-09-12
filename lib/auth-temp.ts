// Temporary auth utilities to fix deployment issues
export const authOptions = {};

export async function getServerSession(options?: any) {
  // Temporary mock implementation for deployment
  return {
    user: {
      id: '1',
      name: 'Demo User',
      email: 'demo@fisioflow.com'
    }
  };
}

export async function getCurrentUser() {
  // Temporary mock implementation for deployment
  return {
    id: '1',
    name: 'Demo User',
    email: 'demo@fisioflow.com'
  };
}