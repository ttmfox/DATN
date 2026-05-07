import { useEffect, useRef, useState } from 'react';
import goongjs from '@goongmaps/goong-js';
import '@goongmaps/goong-js/dist/goong-js.css';
import styles from './styles.module.scss';
import Footer from "../Footer/Footer";

const StoreSystem = () => {
  const [selectedStore, setSelectedStore] = useState(1);
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const markersRef = useRef([]);

  const stores = [
    {
      id: 1,
      name: 'TIRA Trinh Van Bo',
      address: '13 P. Trinh Van Bo, Xuan Phuong, Nam Tu Liem, Ha Noi, Viet Nam',
      phone: '+84 (0) 123 456 789',
      lat: 21.0381,
      lng: 105.7478
    },
    {
      id: 2,
      name: 'TIRA Hoang Mai',
      address: '213 Đ. Hoang Mai, Tuong Mai, Hai Ba Trung, Ha Noi 100000, Viet Nam',
      phone: '+84 (0) 987 654 321',
      lat: 20.9895,
      lng: 105.8526
    }
  ];

  // Initialize map with BTEC FPT coordinates
  useEffect(() => {
    goongjs.accessToken = 'qM35eQ7w1or6MWNEoAXQPUQDZwIdeljIPEGaxdkF';

    mapInstance.current = new goongjs.Map({
      container: mapRef.current,
      style: 'https://tiles.goong.io/assets/goong_map_web.json',
      center: [105.7478, 21.0381], // BTEC FPT, Trịnh Văn Bô coordinates
      zoom: 15,
      hash: true,
      dragRotate: true,
      touchZoomRotate: true,
      doubleClickZoom: true,
      transformRequest: (url, resourceType) => {
        if (resourceType === 'Source' && url.startsWith('http://myHost')) {
          return {
            url: url.replace('http', 'https'),
            headers: { 'my-custom-header': true },
            credentials: 'include'
          };
        }
      }
    });

    // Add navigation control
    const nav = new goongjs.NavigationControl({
      showCompass: true,
      showZoom: true
    });
    mapInstance.current.addControl(nav, 'top-right');

    // Add geolocation control
    const geolocate = new goongjs.GeolocateControl({
      positionOptions: {
        enableHighAccuracy: true
      },
      trackUserLocation: true
    });
    mapInstance.current.addControl(geolocate, 'top-right');

    // Add scale control
    const scale = new goongjs.ScaleControl({
      maxWidth: 80,
      unit: 'metric'
    });
    mapInstance.current.addControl(scale, 'bottom-right');

    // Add fullscreen control with resize handling
    const fullscreenControl = new goongjs.FullscreenControl();
    mapInstance.current.addControl(fullscreenControl, 'top-right');

    // Handle fullscreen change to resize map
    const handleFullscreenChange = () => {
      setTimeout(() => {
        if (mapInstance.current) {
          mapInstance.current.resize();
        }
      }, 100); // Small delay to ensure DOM updates
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);

    return () => {
      if (mapInstance.current) mapInstance.current.remove();
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
    };
  }, []);

  // Update markers and map view
  useEffect(() => {
    if (!mapInstance.current) return;

    // Clear old markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    // Add new markers with popup
    stores.forEach(store => {
      const el = document.createElement('div');
      el.className = styles.marker;
      el.style.backgroundImage = `url(${selectedStore === store.id 
        ? 'http://maps.google.com/mapfiles/ms/icons/red-dot.png' 
        : 'http://maps.google.com/mapfiles/ms/icons/blue-dot.png'})`;
      el.style.width = '32px';
      el.style.height = '32px';
      el.style.backgroundSize = 'cover';
      el.style.cursor = 'pointer';

      const popup = new goongjs.Popup({ offset: 25 })
        .setHTML(`
          <div style="padding: 10px;">
            <h3>${store.name}</h3>
            <p>${store.address}</p>
            <p>${store.phone}</p>
          </div>
        `);

      const marker = new goongjs.Marker(el)
        .setLngLat([store.lng, store.lat])
        .setPopup(popup)
        .addTo(mapInstance.current);

      el.addEventListener('click', () => {
        setSelectedStore(store.id);
        marker.togglePopup();
      });

      markersRef.current.push(marker);
    });

    // Fly to selected store
    const currentStore = stores.find(s => s.id === selectedStore);
    if (currentStore) {
      mapInstance.current.flyTo({
        center: [currentStore.lng, currentStore.lat],
        zoom: 15,
        speed: 1.2,
        curve: 1,
        easing(t) {
          return t;
        }
      });
    }
  }, [selectedStore]);

  const handleGetDirections = (store) => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          const url = `https://www.google.com/maps/dir/?api=1&origin=${latitude},${longitude}&destination=${store.lat},${store.lng}`;
          window.open(url, '_blank');
        },
        (error) => {
          const url = `https://www.google.com/maps/dir/?api=1&destination=${store.lat},${store.lng}`;
          window.open(url, '_blank');
        }
      );
    } else {
      const url = `https://www.google.com/maps/dir/?api=1&destination=${store.lat},${store.lng}`;
      window.open(url, '_blank');
    }
  };

  const handleStoreClick = (store) => {
    setSelectedStore(store.id);
  };

  return (
    <>
      <div className={styles.storeSystem}>
        <div className={styles.storeContainer}>
          <div className={styles.storeList}>
            <h1>Cửa Hàng Của Chúng Tôi</h1>
            {stores.map((store) => (
              <div
                key={store.id}
                className={`${styles.storeCard} ${selectedStore === store.id ? styles.active : ''}`}
                onClick={() => handleStoreClick(store)}
                style={{ cursor: 'pointer' }}
              >
                <h2>{store.name}</h2>
                <p><strong>Địa Chỉ:</strong> {store.address}</p>
                <p><strong>Số Điện Thoại:</strong> {store.phone}</p>
                <button
                  className={styles.directionsButton}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleGetDirections(store);
                  }}
                >
                  Lấy Vị Trí
                </button>
              </div>
            ))}
          </div>

          <div className={styles.mapContainer}>
            <div ref={mapRef} className={styles.map} />
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default StoreSystem;