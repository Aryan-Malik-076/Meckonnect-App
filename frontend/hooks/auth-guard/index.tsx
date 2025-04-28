import { useAuth } from '@/contexts';
import { useRouter, useNavigationContainerRef } from 'expo-router';
import { useEffect } from 'react';

export const AuthGuard = ({ allowedRoles, allowNullRole = false }: { allowedRoles: string[]; allowNullRole: boolean }) => {
  const { userAuth, isReady } = useAuth();
  const router = useRouter();
  const navigationRef = useNavigationContainerRef();

  useEffect(() => {
    if (isReady) {
      console.log('1')
      if (!navigationRef.isReady()) {
        console.log('12')

        return;
      }

      if (!userAuth?.role && allowNullRole) {
        console.log(userAuth)
        console.log('13')

        return;
      }

      if (!userAuth?.role) {
        router.push({ pathname: '/onboard', params: {} });
      } else if (!allowedRoles.includes(userAuth.role) && userAuth.role.length > 1) {
        console.log('User role not allowed', userAuth.role);
        switch (userAuth.role) {
          case 'driver-status-1':
            router.push({ pathname: '/driver-verification', params: {} });
            break;
          case 'driver-status-2':
            router.push({ pathname: '/driver-verification', params: {} });
            break;
          case 'driver':
            router.push({ pathname: '/driver-verification', params: {} });
            break;
          case 'verified-passenger':
            router.push({ pathname: '/' });
            break;
          case 'verified-driver':
            router.push({ pathname: '/' });
            break;  
          default:
            router.push('/login');
        }
      }
    }

  }, [userAuth, isReady]);

  return null;
};
