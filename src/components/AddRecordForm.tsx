// Uvnitř komponenty AddRecordForm přidejte useEffect:
useEffect(() => {
  if (rpssInfo) {
    setFormData(prev => ({
      ...prev,
      druhSluzby: rpssInfo.serviceType // Automatické nastavení podle registru
    }));
  }
}, [rpssInfo]);