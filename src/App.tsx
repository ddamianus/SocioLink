const syncWithRpss = async () => {
    if (!isOnline) { 
      alert('Pro aktualizaci registru musíte být online.'); 
      return; 
    }
    
    setIsSyncingRpss(true);
    try {
      // Použijeme proxy k obejití CORS omezení
      const targetUrl = encodeURIComponent('https://data.mpsv.cz/od/soubory/rpss/rpss.json');
      const proxyUrl = `https://api.allorigins.win/get?url=${targetUrl}`;

      const response = await fetch(proxyUrl);
      if (!response.ok) throw new Error('Network response was not ok');
      
      const rawData = await response.json();
      // AllOrigins vrací data v poli "contents" jako string
      const data = JSON.parse(rawData.contents);
      
      const formatted = data.map((s: any) => ({
        id: parseInt(s.identifikátor_služby),
        organization: s.poskytovatel?.název || 'Neznámý poskytovatel',
        serviceType: s.druh_služby?.název || s.druh_služby || 'Neznámý druh'
      }));

      await db.rpssData.clear();
      await db.rpssData.bulkAdd(formatted);
      
      alert('Registr MPSV byl úspěšně aktualizován!');
      lookupRpssInfo(serviceId);
    } catch (e) {
      console.error(e);
      alert('Chyba při stahování dat. Soubor je příliš velký nebo server MPSV odmítl spojení. \n\nZkuste "Ruční nahrání" (viz návod).');
    } finally {
      setIsSyncingRpss(false);
    }
  };