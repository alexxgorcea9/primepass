import { useState } from 'react';
import TextInputLine from '../../Details/TextInputLine';
import NumberCounterField from '../NumberCounterField';
import FormHeader from '../FormHeader';

interface NewTableFormProps {
  onClose: () => void;
  onSave?: (tableData: TableFormData) => void;
}

export interface TableFormData {
  title: string;
  amount: number;
  seats: number;
  minimumSpend: number;
}

export default function NewTableForm({ onClose, onSave }: NewTableFormProps) {
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState(0);
  const [seats, setSeats] = useState(0);
  const [minimumSpend, setMinimumSpend] = useState(0);

  const isFormValid = title.trim() !== '' && amount > 0 && seats > 0 && minimumSpend > 0;

  const handleSave = () => {
    if (!isFormValid) return;

    if (onSave) {
      onSave({ title, amount, seats, minimumSpend });
    }
    onClose();
  };

  return (
    <div className="w-full self-stretch inline-flex flex-col justify-start items-start gap-2.5 overflow-hidden">
      {/* Header */}
      <FormHeader title="New Table" onClose={onClose} onAdd={handleSave} isAddDisabled={!isFormValid}/>

      {/* Title Input */}
      <TextInputLine
        label="Title"
        value={title}
        onChange={setTitle}
        placeholder="All White Party"
        maxLength={100}
        showCharCount={false}
      />

      {/* Amount Counter */}
      <NumberCounterField
        label="Amount"
        value={amount}
        onChange={setAmount}
        min={0}
      />

      {/* Seats Counter */}
      <NumberCounterField
        label="Seats"
        value={seats}
        onChange={setSeats}
        min={0}
      />

      {/* Minimum Spend Counter */}
      <NumberCounterField
        label="Minimum Spend"
        value={minimumSpend}
        onChange={setMinimumSpend}
        min={0}
        prefix="$"
      />
    </div>
  );
}
