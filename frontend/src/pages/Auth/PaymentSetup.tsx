import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Input from '../../components/Auth/Input';
import Button from '../../components/Auth/Button';
import ImageUpload from '../../components/Auth/ImageUpload';
import ellipse from '../../assets/Ellipse 13.svg';
import { getRedirectPath } from '@/utils/pathUtils';

interface PaymentData {
  cardholderName: string;
  cardNumber: string;
  expiryDate: string;
  cvv: string;
}

const PaymentSetup: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, updateProfile } = useAuth();
  const [role, setRole] = useState<string>('guest');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [paymentData, setPaymentData] = useState<PaymentData>({
    cardholderName: '',
    cardNumber: '',
    expiryDate: '',
    cvv: '',
  });

  // Set user role from query params or user context
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const userRole = params.get('role') || user?.role || 'guest';
    // Normalize role to lowercase for consistent comparison
    setRole(userRole.toLowerCase());
  }, [location.search, user]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const { name, value } = e.target;
    setPaymentData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSkip = () => {
    // Redirect based on role
    navigateBasedOnRole();
  };

  const navigateBasedOnRole = () => {
    let redirectPath = '/events';
    
    if (user && user.role) {
      // If user has a name, use it for the slug
      if (user.name) {
        redirectPath = getRedirectPath(user.role, user.name);
      } else {
        // Fallback for organizers/team without a name - use email slug
        const emailSlug = user.email.split('@')[0].toLowerCase();
        redirectPath = getRedirectPath(user.role, emailSlug);
      }
    }
    
    navigate(redirectPath, { replace: true });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Here you would send payment data to your payment processor
      // For now we'll simulate a successful payment setup
      console.log('Payment data:', paymentData);

      // TODO: Integrate with payment processor (Stripe, etc.)
      
      // Redirect based on role
      navigateBasedOnRole();
    } catch (err) {
      console.error('Payment setup error:', err);
      setError('Failed to setup payment method. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderPaymentForm = () => (
    <div className='flex flex-col gap-[20px]'>
      <Input
        type='text'
        name='cardholderName'
        label='Cardholder Name'
        value={paymentData.cardholderName}
        onChange={handleInputChange}
        required
      />

      <Input
        type='card-number'
        name='cardNumber'
        label='Card Number'
        value={paymentData.cardNumber}
        onChange={handleInputChange}
        required
      />

      <div className='flex gap-3'>
        <Input
          type='expiry'
          name='expiryDate'
          label='Exp'
          value={paymentData.expiryDate}
          onChange={handleInputChange}
          required
          className='flex-1'
        />

        <Input
          type='cvv'
          name='cvv'
          label='CVV'
          value={paymentData.cvv}
          onChange={handleInputChange}
          required
          className='w-20'
        />
      </div>
    </div>
  );

  const getPageTitle = () => 'Set up your payment method';

  return (
    <div className='relative flex min-h-[100dvh] flex-col items-center bg-[#0A0A0A] px-5 pt-[280px] md:pt-[200px] pb-16'>
      {/* White vertical line - hidden on mobile */}
      <div className='absolute top-[60px] left-[60px] h-[180px] w-[1px] bg-[rgba(247,247,247,0.6)] hidden md:block'></div>

      {/* Ellipse background - hidden on mobile */}
      <img
        src={ellipse}
        alt=''
        className='absolute z-0 hidden md:block'
        style={{
          left: '60px',
          top: '60px',
          transform: 'translate(-50%, -50%) rotate(90deg)',
        }}
      />

      <form
        onSubmit={handleSubmit}
        className='z-10 w-full max-w-[440px] space-y-6'
      >
        <h2 className='mb-6 text-center text-xl md:text-2xl font-semibold text-white'>
          {getPageTitle()}
        </h2>

        <div className='flex flex-col gap-[20px] p-[10px]'>
          {renderPaymentForm()}

          <div className='mt-6 flex gap-4'>
            <Button
              text='Skip'
              variant='secondary'
              type='button'
              onClick={handleSkip}
              className='flex-1'
            />
            <Button
              text={loading ? 'Processing...' : 'Finish'}
              variant='primary'
              type='submit'
              disabled={loading}
              className='flex-1'
            />
          </div>

          {error && (
            <p className='pl-2 font-[Lufga] text-sm text-[#FF5151]'>{error}</p>
          )}
        </div>
      </form>
    </div>
  );
};

export default PaymentSetup;
