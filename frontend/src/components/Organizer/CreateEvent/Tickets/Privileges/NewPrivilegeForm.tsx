import { useState } from 'react';
import { Plus, Ticket, Rocket, X, Image as ImageIcon } from 'lucide-react';
import TextInputLine from '../../Details/TextInputLine';
import DescriptionField from '../../../DescriptionField';
import ImageUploadZone from '../../Media/ImageUploadZone';
import LaunchOverview from '../../Launch/LaunchOverview';
import FormHeader from '../FormHeader';

interface NewPrivilegeFormProps {
  onClose: () => void;
  onSave?: (privilegeData: PrivilegeFormData) => void;
}

export interface PrivilegeFormData {
  title: string;
  description: string;
}

export default function NewPrivilegeForm({ onClose, onSave }: NewPrivilegeFormProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [activeSubTab, setActiveSubTab] = useState(0);

  const subTabs = ['Details', 'Media', 'Tickets', 'Launch'];

  const isFormValid = title.trim() !== '' && description.trim() !== '';

  const handleSave = () => {
    if (!isFormValid) return;

    if (onSave) {
      onSave({ title, description });
    }
    onClose();
  };

  const handleTabChange = (index: number) => {
    console.log('Tab clicked:', subTabs[index], 'Index:', index);
    setActiveSubTab(index);
  };

  return (
    <div className="w-full self-stretch inline-flex flex-col justify-start items-center gap-2.5 overflow-hidden">

      <FormHeader title="New Privilege" onClose={onClose} onAdd={handleSave} isAddDisabled={!isFormValid}/>

      {/* Title Input */}
      <TextInputLine
        label="Title"
        value={title}
        onChange={setTitle}
        placeholder="All White Party"
        maxLength={100}
        showCharCount={false}
      />

      {/* Description */}
      <DescriptionField
        value={description}
        onChange={setDescription}
        placeholder="This is a description of the event..."
      />
    </div>
  );
}
