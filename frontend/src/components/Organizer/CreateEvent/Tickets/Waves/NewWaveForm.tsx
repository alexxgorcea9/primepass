import { useState } from 'react';
import FormHeader from '../FormHeader';
import TextInputLine from '../../Details/TextInputLine';
import NumberCounterField from '../NumberCounterField';

interface NewWaveFormProps {
  onClose: () => void;
  onSave?: (waveData: WaveFormData) => void;
}

export interface WaveFormData {
  name: string;
  amount: number;
  price: number;
}

export default function NewWaveForm({ onClose, onSave }: NewWaveFormProps) {
  const [name, setName] = useState('');
  const [amount, setAmount] = useState(0);
  const [price, setPrice] = useState(0);

  // Validation: name must not be empty, amount and price must be greater than 0
  const isFormValid = name.trim() !== '' && amount > 0 && price > 0;

  const handleSave = () => {
    if (!isFormValid) return;

    if (onSave) {
      onSave({ name, amount, price });
    }
    onClose();
  };

  return (
    <div className="w-full self-stretch inline-flex flex-col justify-start items-start gap-2.5 overflow-hidden">
      {/* Header */}
      <FormHeader
        title="New Wave"
        onClose={onClose}
        onAdd={handleSave}
        isAddDisabled={!isFormValid}
      />

      {/* Name Input */}
      <TextInputLine
        label="Name"
        value={name}
        onChange={setName}
        placeholder="Wave name"
        maxLength={20}
        showCharCount={true}
      />

      {/* Amount Counter */}
      <NumberCounterField
        label="Amount"
        value={amount}
        onChange={setAmount}
        min={0}
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