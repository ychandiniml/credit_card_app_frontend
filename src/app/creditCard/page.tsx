"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { Switch } from '@headlessui/react';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import SearchBar from '@/components/SearchBar';
import AddCardButton from '@/components/AddCardButton';
import CardTable from '@/components/CardTable';
import CardModal from '@/components/CardModal';
import DeleteModal from '@/components/DeleteModal';
import { fetchCards, addCard, updateCard, deleteCard } from '../../api/apiService';

interface CreditCard {
  id: number;
  name: string;
  bankName: string;
  enabled: boolean;
  createdAt: string;
}

const CreditCardTable: React.FC = () => {
  const [rowData, setRowData] = useState<CreditCard[]>([]);
  const [searchText, setSearchText] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [modalData, setModalData] = useState<Partial<CreditCard>>({});
  const [isEditing, setIsEditing] = useState(false);
  const [selectedCardId, setSelectedCardId] = useState<number | null>(null);

  // Fetch cards from the API on component mount
  useEffect(() => {
    const getCards = async () => {
      try {
        const data = await fetchCards();
        setRowData(formatCardData(data));
      } catch (error) {
        console.error('Error fetching cards:', error);
      }
    };
    getCards();
  }, []);

  const filteredData = useMemo(() => {
    return rowData.filter(card =>
      card.name.toLowerCase().includes(searchText.toLowerCase()) ||
      card.bankName.toLowerCase().includes(searchText.toLowerCase())
    );
  }, [searchText, rowData]);

  const columnDefs = useMemo(() => [
    { headerName: "ID", field: "id" },
    { headerName: "Bank Name", field: "bankName" },
    { headerName: "Full Name", field: "name" },
    { headerName: "Created At", field: "createdAt" },
    {
      headerName: "Enabled",
      field: "enabled",
      cellRenderer: (params: any) => (
        <Switch
          checked={params.value}
          onChange={() => {}}
          className={`${params.value ? 'bg-green-500' : 'bg-gray-300'} relative inline-flex items-center h-6 rounded-full w-11`}
        >
          <span
            className={`${params.value ? 'translate-x-6' : 'translate-x-1'} inline-block w-4 h-4 transform bg-white rounded-full`}
          />
        </Switch>
      )
    },
    {
      headerName: "Actions",
      field: "actions",
      cellRenderer: (params: any) => (
        <>
          <button
            onClick={() => handleEditCard(params.data)}
            className="bg-blue-500 text-white px-3 py-2 text-xs font-medium rounded hover:bg-blue-800"
          >
            Edit
          </button>
          <button
            onClick={() => handleDeleteModal(params.data.id)}
            className="bg-red-500 text-white px-3 py-2 text-xs font-medium rounded hover:bg-red-800"
          >
            Delete
          </button>
        </>
      )
    }
  ], []);

  const handleEditCard = (card: CreditCard) => {
    setSelectedCardId(card.id);
    setModalData({ ...card });
    setIsEditing(true);
    setIsModalOpen(true);
  };

  const handleDeleteModal = (cardId: number) => {
    setSelectedCardId(cardId);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteCard = async () => {
    try {
      if (selectedCardId) {
        await deleteCard(selectedCardId); // API call to delete the card
        setRowData(rowData.filter(card => card.id !== selectedCardId));
        setIsDeleteModalOpen(false);
      }
    } catch (error) {
      console.error('Error deleting card:', error);
    }
  };

  const handleSaveCard = async () => {
    try {
      if (isEditing) {
        // API call to update the card
        await updateCard(selectedCardId as number, modalData);
        setRowData(rowData.map(card =>
          card.id === selectedCardId ? { ...modalData, id: selectedCardId } as CreditCard : card
        ));
      } else {
        const newCard = {
          name: modalData.name,
          bankName: modalData.bankName,
          enabled: modalData.enabled,
        };
  
        // API call to add a new card
        const response = await addCard(newCard);
        const createdCard = {
          id: response.cardId,
          ...newCard,
          createdAt: new Date().toLocaleDateString(),
        };
        setRowData([...rowData, createdCard]);
      }
      setIsModalOpen(false);
    } catch (error) {
      console.error('Error saving card:', error);
    }
  };
  
  const handleAddCard = () => {
    setModalData({ enabled: true });
    setIsEditing(false);
    setIsModalOpen(true);
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Credit Cards</h1>

      <div className="flex justify-between mb-4">
        <SearchBar searchText={searchText} onSearchChange={(e) => setSearchText(e.target.value)} />
        <AddCardButton onClick={handleAddCard} />
      </div>

      <CardTable
        rowData={filteredData}
        columnDefs={columnDefs}
        paginationPageSize={10}
      />

      <CardModal
        isOpen={isModalOpen}
        onRequestClose={() => setIsModalOpen(false)}
        isEditing={isEditing}
        modalData={modalData}
        onSave={handleSaveCard}
        onChange={(field, value) => setModalData({ ...modalData, [field]: value })}
      />

      <DeleteModal
        isOpen={isDeleteModalOpen}
        onRequestClose={() => setIsDeleteModalOpen(false)}
        onDelete={handleDeleteCard}
      />
    </div>
  );
};

export default CreditCardTable;

// Helper functions
const formatCardData = (data: any): CreditCard[] => {
  return data.cards.map((card: any) => ({
    id: card.cardId,
    name: card.name,
    bankName: card.bank.name,
    enabled: card.enabled,
    createdAt: new Date(card.createdAt).toLocaleDateString(),
  }));
};
