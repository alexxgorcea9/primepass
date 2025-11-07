import { useNavigate, useParams } from 'react-router-dom';
import QRScanner from '@components/Organizer/EventDetails/Checkin/QRScanner';

const QRScanPage = () => {
  const navigate = useNavigate();
  const { username, event_id } = useParams<{ username: string; event_id: string }>();

  const handleScan = (data: string) => {
    console.log('Scanned data:', data);
    // TODO: Process the scanned QR code data
    // For now, just navigate back to event details
    navigate(`/${username}/event/${event_id}`);
  };

  const handleClose = () => {
    navigate(`/${username}/event/${event_id}`);
  };

  return (
    <QRScanner
      onClose={handleClose}
      onScan={handleScan}
    />
  );
};

export default QRScanPage;
