// public/fetch.js
// Componente para integração com backend - Fullstack Version

class FormDataService {
    constructor() {
        this.apiBaseUrl = '/api';
        this.isDevelopment = window.location.hostname === 'localhost' || 
                           window.location.hostname === '127.0.0.1';
        
        console.log('🚀 FormDataService inicializado - Fullstack Mode');
        this.init();
    }

    init() {
        this.setupEventListeners();
    }

    setupEventListeners() {
        document.addEventListener('documentsGenerated', (event) => {
            this.handleDocumentsGeneration(event.detail);
        });
    }

    prepareFormData(formData, backgrounds = {}) {
        return {
            pet_name: formData.nome || '',
            pet_gender: formData.sexo || '',
            pet_breed: formData.raca || '',
            pet_color: formData.cor || '',
            pet_birth_date: formData.dataNascimento || '',
            owner_name: formData.nomeTutor || '',
            owner_contact: formData.contatoTutor || '',
            address_state: formData.estado || '',
            address_city: formData.cidade || '',
            address_neighborhood: formData.bairro || '',
            address_street: formData.rua || '',
            address_number: formData.numeroCasa || '',
            preferences_team: formData.time || '',
            selected_backgrounds: JSON.stringify(backgrounds || {}),
            session_id: this.getSessionId(),
            user_agent: navigator.userAgent,
            source: 'rg_pet_web_app',
            generated_at: new Date().toISOString()
        };
    }

    async uploadPetPhoto(file, orderId) {
        try {
            console.log('📤 Iniciando upload da foto...');

            const signedUrlResponse = await fetch(`${this.apiBaseUrl}/upload/signed-url`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    fileName: file.name,
                    fileType: file.type,
                    orderId: orderId
                })
            });

            if (!signedUrlResponse.ok) {
                throw new Error('Erro ao obter URL para upload');
            }

            const { signedUrl, filePath, publicUrl } = await signedUrlResponse.json();
            console.log('✅ URL assinada obtida:', { filePath });

            const uploadResponse = await fetch(signedUrl, {
                method: 'PUT',
                headers: {
                    'Content-Type': file.type,
                },
                body: file
            });

            if (!uploadResponse.ok) {
                throw new Error(`Upload falhou: ${uploadResponse.status}`);
            }

            console.log('✅ Upload realizado com sucesso!');
            return { filePath, publicUrl };

        } catch (error) {
            console.error('❌ Erro no upload da foto:', error);
            throw new Error(`Falha no upload da imagem: ${error.message}`);
        }
    }

    async compressImage(file, maxWidth = 800, quality = 0.8) {
        return new Promise((resolve) => {
            if (file.size < 500000) {
                resolve(file);
                return;
            }

            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const img = new Image();

            img.onload = () => {
                let width = img.width;
                let height = img.height;

                if (width > maxWidth) {
                    height = (height * maxWidth) / width;
                    width = maxWidth;
                }

                canvas.width = width;
                canvas.height = height;

                ctx.drawImage(img, 0, 0, width, height);

                canvas.toBlob((blob) => {
                    const compressedFile = new File([blob], file.name, {
                        type: 'image/jpeg',
                        lastModified: Date.now()
                    });
                    console.log('📊 Imagem comprimida');
                    resolve(compressedFile);
                }, 'image/jpeg', quality);
            };

            img.src = URL.createObjectURL(file);
        });
    }

    async submitOrder(formData, backgrounds = {}) {
        try {
            this.showNotification('💾 Salvando dados do seu pet...', 'info');

            const payload = this.prepareFormData(formData, backgrounds);
            
            console.log('📦 Enviando dados do pedido:', payload);

            const response = await fetch(`${this.apiBaseUrl}/orders`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Erro ${response.status}: ${errorText}`);
            }

            const result = await response.json();
            console.log('✅ Pedido criado:', result);

            if (formData.foto && result.orderId) {
                this.handlePhotoUploadInBackground(formData.foto, result.orderId)
                    .then((photoData) => {
                        console.log('✅ Upload da foto concluído:', photoData);
                        this.dispatchOrderEvent('photoUploaded', {
                            orderId: result.orderId,
                            photoUrl: photoData.publicUrl
                        });
                    })
                    .catch((uploadError) => {
                        console.warn('⚠️ Upload da foto falhou:', uploadError);
                        this.dispatchOrderEvent('photoUploadError', {
                            orderId: result.orderId,
                            error: uploadError.message
                        });
                    });
            }

            this.trackConversion('order_created', result.orderId);
            this.dispatchOrderEvent('orderSubmitted', result);
            this.showNotification('✅ Dados salvos com sucesso!', 'success');
            return result;
            
        } catch (error) {
            console.error('❌ Erro ao enviar pedido:', error);
            this.dispatchOrderEvent('orderError', { error: error.message });
            this.showNotification('❌ Erro ao salvar dados.', 'error');
            throw error;
        }
    }

    async handlePhotoUploadInBackground(file, orderId) {
        try {
            const compressedFile = await this.compressImage(file);
            const photoData = await this.uploadPetPhoto(compressedFile, orderId);
            await this.updateOrderPhoto(orderId, photoData.publicUrl);
            this.showNotification('✅ Foto do pet salva!', 'success');
            return photoData;
        } catch (error) {
            console.error('Erro no upload em background:', error);
            this.showNotification('⚠️ Foto salva.', 'warning');
            throw error;
        }
    }

    async updateOrderPhoto(orderId, photoUrl) {
        try {
            const response = await fetch(`/api/orders/${orderId}/photo`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    pet_photo_url: photoUrl,
                    updated_at: new Date().toISOString()
                })
            });

            if (!response.ok) {
                throw new Error('Erro ao atualizar foto no pedido');
            }

            return await response.json();
        } catch (error) {
            console.warn('Erro ao atualizar foto do pedido:', error);
            throw error;
        }
    }

    async handleDocumentsGeneration(data) {
        try {
            console.log('📄 Documentos gerados, enviando dados...', data);
            const result = await this.submitOrder(data.formData, data.backgrounds);
            return result;
        } catch (error) {
            console.error('Erro ao processar documentos:', error);
            return null;
        }
    }

    async trackConversion(event, value = null) {
        const analyticsData = {
            event_type: event,
            session_id: this.getSessionId(),
            user_agent: navigator.userAgent,
            event_value: value,
            page_url: window.location.href,
            timestamp: new Date().toISOString()
        };

        console.log('📊 Evento de analytics:', analyticsData);

        fetch(`${this.apiBaseUrl}/analytics`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(analyticsData)
        }).catch(err => console.warn('Erro analytics:', err));
    }

    getSessionId() {
        let sessionId = localStorage.getItem('rg_pet_session_id');
        if (!sessionId) {
            sessionId = 'sess_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            localStorage.setItem('rg_pet_session_id', sessionId);
        }
        return sessionId;
    }

    dispatchOrderEvent(eventName, detail) {
        const event = new CustomEvent(`rgPet_${eventName}`, {
            detail: detail,
            bubbles: true
        });
        document.dispatchEvent(event);
    }

    showNotification(message, type = 'info') {
        if (typeof showQuickNotification === 'function') {
            showQuickNotification(message, type);
        } else {
            console.log(`${type.toUpperCase()}: ${message}`);
            const notification = document.createElement('div');
            notification.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                background: ${type === 'success' ? '#27ae60' : type === 'error' ? '#e74c3c' : '#3498db'};
                color: white;
                padding: 12px 20px;
                border-radius: 8px;
                z-index: 10000;
                font-weight: 600;
            `;
            notification.textContent = message;
            document.body.appendChild(notification);
            
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 3000);
        }
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
}

const formDataService = new FormDataService();
window.FormDataService = formDataService;

console.log('🚀 Fetch.js carregado - Fullstack Mode Ativo!');