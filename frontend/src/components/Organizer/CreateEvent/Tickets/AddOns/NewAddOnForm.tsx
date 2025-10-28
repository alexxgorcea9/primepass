import { useState } from 'react';
import QuantitySelector from '@components/Organizer/CreateEvent/Tickets/AddOns/QuantitySelector';
import TextInputLine from '../../Details/TextInputLine';
import DescriptionField from '../../../DescriptionField';
import NumberCounterField from '../NumberCounterField';
import FormHeader from '../FormHeader';

interface NewAddOnFormProps {
  onClose: () => void;
  onSave?: (addOnData: AddOnFormData) => void;
}

export interface AddOnFormData {
  title: string;
  description: string;
  isUnlimited: boolean;
  amount: number;
  price: number;
}

export default function NewAddOnForm({ onClose, onSave }: NewAddOnFormProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isUnlimited, setIsUnlimited] = useState(true);
  const [amount, setAmount] = useState(0);
  const [price, setPrice] = useState(0);

  const isFormValid = title.trim() !== '' && description.trim() !== '' && (isUnlimited || amount > 0) && price > 0;

  const handleSave = () => {
    if (!isFormValid) return;

    if (onSave) {
      onSave({ title, description, isUnlimited, amount, price });
    }
    onClose();
  };

  return (
    <div className="w-full self-stretch inline-flex flex-col justify-start items-start gap-2.5 overflow-hidden">
      {/* Header */}
      <FormHeader title="New Add-On" onClose={onClose} onAdd={handleSave} isAddDisabled={!isFormValid}/>

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

      {/* Amount Toggle & Counter */}
      <QuantitySelector
        isUnlimited={isUnlimited}
        quantity={amount}
        onUnlimitedChange={setIsUnlimited}
        onQuantityChange={setAmount}
      />

      {/* Price Counter */}
      <NumberCounterField
        label="Price"
        value={price}
        onChange={setPrice}
        min={0}
        prefix="$"
      />
    </div>
  );
}
