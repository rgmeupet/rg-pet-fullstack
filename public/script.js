// public/script.js
// Variáveis globais
let currentStep = 1;
const totalSteps = 7;
let formData = {
    nome: '',
    foto: null,
    sexo: '',
    nomeTutor: '',
    contatoTutor: '',
    raca: '',
    cor: '',
    dataNascimento: '',
    estado: '',
    cidade: '',
    bairro: '',
    rua: '',
    numeroCasa: '',
    time: ''
};

// Sistema de backgrounds com bolinhas de cores
let currentBackgrounds = {
    carteira_frente: 'img/z7.png',
    carteira_verso: 'img/z8.png',
    vacina: 'img/9.png',
    certidao: 'img/a1.png',
    medicacao: 'img/14.png',
    peso: 'img/11.png'
};

const backgrounds = {
    carteira_frente: [
        { color: '#ff0088ff', image: 'img/z7.png' },
        { color: '#4ECDC4', image: 'img/z5.png' },
        { color: '#1e00ffff', image: 'img/z1.png' },
        { color: '#fea100ff', image: 'img/z3.png' },
        { color: '#a204b7ff', image: 'img/z9.png' }
       
    ],
    carteira_verso: [
        { color: '#ff0088ff', image: 'img/z8.png' },
        { color: '#4ECDC4', image: 'img/z6.png' },
        { color: '#1e00ffff', image: 'img/z2.png' },
        { color: '#fea100ff', image: 'img/z4.png' },
        { color: '#a204b7ff', image: 'img/z10.png' }
        
    ],
    vacina: [
        { color: '#FF6B6B', image: 'img/9.png' },
        { color: '#4ECDC4', image: 'img/10.png' },
        { color: '#45B7D1', image: 'img/9.png' },
        { color: '#96CEB4', image: 'img/10.png' }
    ],
    certidao: [
        { color: '#FFEAA7', image: 'img/a1.png' },
        { color: '#D8BFD8', image: 'img/a2.png' },
        { color: '#87CEEB', image: 'img/a3.png' },
        { color: '#98FB98', image: 'img/a4.png' }
    ],
    medicacao: [
        { color: '#FF9999', image: 'img/14.png' },
        { color: '#99FF99', image: 'img/14.png' },
        { color: '#9999FF', image: 'img/14.png' },
        { color: '#FFFF99', image: 'img/14.png' }
    ],
    peso: [
        { color: '#FFB366', image: 'img/11.png' },
        { color: '#66FFB3', image: 'img/12.png' },
        { color: '#B366FF', image: 'img/11.png' },
        { color: '#FF66B3', image: 'img/12.png' }
    ]
};

// Inicialização
document.addEventListener('DOMContentLoaded', function() {
    initApp();
});

function initApp() {
    initEventListeners();
    updateProgress();
    initPhotoPreview();
    
    // Inicializa as opções de quiz/card
    setupQuizOptions('sexoOptions', 'sexo'); 
    setupQuizOptions('timeOptions', 'time');
    
    // Modal de aviso após 6 segundos
    setTimeout(abrirModal, 6000);

    // Listeners para eventos do fetch service
    setupFetchEventListeners();
}

// Event Listeners
function initEventListeners() {
    // Foto upload
    const fotoInput = document.getElementById('foto');
    if (fotoInput) {
        fotoInput.addEventListener('change', handlePhotoUpload);
    }
    
    // Enter key para avançar
    document.addEventListener('keypress', function(e) {
        if (e.key === 'Enter' && currentStep < totalSteps) {
            nextStep(currentStep + 1);
        }
    });
}

/**
 * Configura listeners para eventos do serviço de fetch
 */
function setupFetchEventListeners() {
    document.addEventListener('rgPet_orderSubmitted', (event) => {
        console.log('🎉 Pedido salvo no backend:', event.detail);
    });

    document.addEventListener('rgPet_photoUploaded', (event) => {
        console.log('📸 Foto salva:', event.detail);
    });

    document.addEventListener('rgPet_orderError', (event) => {
        console.error('❌ Erro no pedido:', event.detail.error);
    });
}

// Navegação entre etapas
function nextStep(step) {
    if (!validateStep(currentStep)) {
        return;
    }
    
    saveStepData(currentStep);
    
    // Adiciona classe para animação de saída (slide para esquerda)
    const currentStepElement = document.getElementById(`step${currentStep}`);
    const nextStepElement = document.getElementById(`step${step}`);
    
    // Aplica animação de saída e, em seguida, remove a classe active
    currentStepElement.classList.remove('active');
    
    // Adiciona a classe 'active' ao próximo passo
    nextStepElement.classList.add('active');
    
    currentStep = step;
    updateProgress();
    
    // Rola para o topo do formulário
    document.querySelector('.form-container').scrollIntoView({ behavior: 'smooth' });
}

function prevStep(step) {
    // Adiciona classe para animação de saída (slide para direita - anterior)
    const currentStepElement = document.getElementById(`step${currentStep}`);
    const prevStepElement = document.getElementById(`step${step}`);
    
    currentStepElement.classList.add('leaving-prev'); // Nova classe para animação de retorno
    
    setTimeout(() => {
        currentStepElement.classList.remove('active');
        currentStepElement.classList.remove('leaving-prev');
        
        prevStepElement.classList.add('active');
        
        currentStep = step;
        updateProgress();
        
        document.querySelector('.form-container').scrollIntoView({ behavior: 'smooth' });
    }, 500); // Tempo igual à transição CSS
}

// Validação de passos
function validateStep(step) {
    switch(step) {
        case 1:
            const nome = document.getElementById('nome').value.trim();
            const sexo = document.getElementById('sexo').value;
            
            if (!nome) {
                alert('Por favor, digite o nome do seu pet.');
                document.getElementById('nome').focus();
                return false;
            }
            
            if (!sexo) {
                alert('Por favor, selecione o sexo do seu pet.');
                return false;
            }
            return true;
            
        case 2:
            if (!formData.foto) {
                alert('Por favor, adicione uma foto do seu pet.');
                return false;
            }
            
            const nomeTutor = document.getElementById('nomeTutor').value.trim();
            if (!nomeTutor) {
                alert('Por favor, digite seu nome.');
                document.getElementById('nomeTutor').focus();
                return false;
            }
            return true;
            
        case 3:
            const contatoTutor = document.getElementById('contatoTutor').value.trim();
            if (!contatoTutor) {
                alert('Por favor, digite seu contato.');
                document.getElementById('contatoTutor').focus();
                return false;
            }
            return true;
            
        case 4:
            const raca = document.getElementById('raca').value.trim();
            const cor = document.getElementById('cor').value.trim();
            
            if (!raca) {
                alert('Por favor, digite a raça do seu pet.');
                document.getElementById('raca').focus();
                return false;
            }
            
            if (!cor) {
                alert('Por favor, digite a cor do seu pet.');
                document.getElementById('cor').focus();
                return false;
            }
            return true;
            
        case 5:
            const estado = document.getElementById('estado').value.trim();
            const cidade = document.getElementById('cidade').value.trim();
            const bairro = document.getElementById('bairro').value.trim();
            
            if (!estado) {
                alert('Por favor, digite o estado.');
                document.getElementById('estado').focus();
                return false;
            }
            
            if (!cidade) {
                alert('Por favor, digite a cidade.');
                document.getElementById('cidade').focus();
                return false;
            }
            
            if (!bairro) {
                alert('Por favor, digite o bairro.');
                document.getElementById('bairro').focus();
                return false;
            }
            return true;
            
        case 6:
            const rua = document.getElementById('rua').value.trim();
            const numeroCasa = document.getElementById('numeroCasa').value.trim();
            
            if (!rua) {
                alert('Por favor, digite a rua.');
                document.getElementById('rua').focus();
                return false;
            }
            
            if (!numeroCasa) {
                alert('Por favor, digite o número da casa.');
                document.getElementById('numeroCasa').focus();
                return false;
            }
            return true;
            
        case 7:
            const time = document.getElementById('time').value;
            if (!time) {
                alert('Por favor, selecione o time do coração.');
                return false;
            }
            return true;
            
        default:
            return true;
    }
}

// Salvar dados do passo
function saveStepData(step) {
    switch(step) {
        case 1:
            formData.nome = document.getElementById('nome').value.trim();
            formData.sexo = document.getElementById('sexo').value;
            break;
        case 2:
            formData.nomeTutor = document.getElementById('nomeTutor').value.trim();
            break;
        case 3:
            formData.contatoTutor = document.getElementById('contatoTutor').value.trim();
            formData.dataNascimento = document.getElementById('dataNascimento').value.trim();
            break;
        case 4:
            formData.raca = document.getElementById('raca').value.trim();
            formData.cor = document.getElementById('cor').value.trim();
            break;
        case 5:
            formData.estado = document.getElementById('estado').value.trim();
            formData.cidade = document.getElementById('cidade').value.trim();
            formData.bairro = document.getElementById('bairro').value.trim();
            break;
        case 6:
            formData.rua = document.getElementById('rua').value.trim();
            formData.numeroCasa = document.getElementById('numeroCasa').value.trim();
            break;
        case 7:
            formData.time = document.getElementById('time').value;
            break;
    }
}

// Atualizar barra de progresso
function updateProgress() {
    const progress = (currentStep / totalSteps) * 100;
    const progressBar = document.getElementById('progress');
    const doguinho = document.getElementById('doguinho');

    if (progressBar) {
        progressBar.style.width = `${progress}%`;
    }

    if (doguinho && progressBar) {
        // Obter a largura do contêiner da barra de progresso (a parte colorida)
        const progressContainerWidth = progressBar.offsetWidth;
        const doguinhoWidth = doguinho.offsetWidth;
        
        // A posição é baseada na largura da barra de progresso, menos metade da largura do doguinho
        let newPosition = progressContainerWidth - (doguinhoWidth / 2);
        
        // Garante que o doguinho não saia do início se o progresso for 0
        if (progress === 0) {
            newPosition = -doguinhoWidth / 2;
        } 
        // Garante que o doguinho não saia do final se o progresso for 100%
        else if (progress === 100) {
            newPosition = progressContainerWidth - doguinhoWidth / 2;
        } else {
            // Calcula a posição proporcional baseada no contêiner total
            const totalWidth = progressBar.parentElement.offsetWidth;
            newPosition = (totalWidth * (progress / 100)) - (doguinhoWidth / 2);
        }

        // Aplica a posição, garantindo que não ultrapasse os limites
        doguinho.style.left = `${Math.min(Math.max(0, newPosition), progressBar.parentElement.offsetWidth - doguinhoWidth)}px`;
    }
}

// Upload e preview de foto
function initPhotoPreview() {
    const inputFoto = document.getElementById("foto");
    const preview = document.getElementById("preview");
    const remover = document.querySelector(".remove-preview");

    if (!inputFoto || !preview || !remover) return;

    inputFoto.addEventListener("change", function() {
        const file = this.files[0];
        if (!file) return;

        const allowedTypes = ['image/jpeg', 'image/png'];
        if (!allowedTypes.includes(file.type)) {
            showQuickNotification('Formato inválido. Use JPEG ou PNG.', 'error');
            this.value = "";
            preview.style.display = "none";
            remover.style.display = "none";
            return;
        }

        const reader = new FileReader();
        reader.onload = function(e) {
            preview.src = e.target.result;
            preview.style.display = "block";
            remover.style.display = "flex";
            formData.foto = file;
        };
        reader.readAsDataURL(file);
    });

    remover.addEventListener("click", function() {
        inputFoto.value = "";
        preview.src = "";
        preview.style.display = "none";
        remover.style.display = "none";
        formData.foto = null;
    });
}

function handlePhotoUpload(event) {
    const file = event.target.files[0];
    if (file) {
        if (!file.type.startsWith('image/')) {
            showQuickNotification('Por favor, selecione uma imagem válida (JPG ou PNG)', 'error');
            return;
        }
        
        if (file.size > 5 * 1024 * 1024) {
            showQuickNotification('A imagem é muito grande. Por favor, escolha uma imagem menor que 5MB.', 'error');
            return;
        }
        
        formData.foto = file;
    }
}

// Modal de aviso
function abrirModal() {
    const modal = document.getElementById("modal-aviso");
    if (modal) {
        modal.style.display = "flex";
    }
}

function fecharModal() {
    const modal = document.getElementById("modal-aviso");
    if (modal) {
        modal.style.display = "none";
    }
}

// Modal Tutorial ficava aqui


// Formatação de nome
function formatarNome(nome) {
    if (!nome) return '';
    return nome
        .toLowerCase()
        .split(' ')
        .map(palavra => palavra.charAt(0).toUpperCase() + palavra.slice(1))
        .join(' ');
}

// ====================
// FUNÇÃO PRINCIPAL MODIFICADA - COM INTEGRAÇÃO BACKEND
// ====================

/**
 * Geração de documentos - AGORA COM BACKEND
 */
async function iniciarGeracao() {
    if (!validateStep(7)) {
        return;
    }
    
    saveStepData(7);
    
    if (!formData.nome || !formData.foto || !formData.sexo || !formData.nomeTutor || !formData.contatoTutor || !formData.raca || !formData.cor || !formData.estado || !formData.cidade || !formData.bairro || !formData.rua || !formData.numeroCasa || !formData.time) {
        alert('Por favor, preencha todos os campos obrigatórios antes de gerar os documentos.');
        return;
    }
    
    const gerarButton = document.getElementById("gerarButton");
    if (gerarButton) {
        gerarButton.innerHTML = '<i class="fas fa-spinner spinner"></i> Gerando...';
        gerarButton.disabled = true;
    }
    
    try {
        // 1. Gera documentos primeiro (experiência do usuário)
        initBackgroundSelectors();
        renderAllCanvases();
        showSuccessMessage();
        
        // 2. Envia dados para backend EM PARALELO (não bloqueia)
        enviarDadosParaBackend();
        
        setTimeout(() => {
            document.getElementById('documentsContainer').style.display = 'block';
            document.getElementById('documentsContainer').scrollIntoView({ behavior: 'smooth' });
            
            if (gerarButton) {
                gerarButton.innerHTML = '<i class="fas fa-file-alt"></i> Gerar Documentos';
                gerarButton.disabled = false;
            }
        }, 1000);
        
    } catch (error) {
        console.error('Erro no processo de geração:', error);
        if (gerarButton) {
            gerarButton.innerHTML = '<i class="fas fa-file-alt"></i> Gerar Documentos';
            gerarButton.disabled = false;
        }
    }
}

/**
 * Envia dados para o backend (em background)
 */
async function enviarDadosParaBackend() {
    try {
        console.log('🔄 Enviando dados para backend...');
        
        // Usa o serviço de fetch para enviar os dados
        const result = await window.FormDataService.submitOrder(formData, currentBackgrounds);
        
        console.log('✅ Dados enviados com sucesso:', result);
        
    } catch (error) {
        console.error('❌ Erro ao enviar para backend:', error);
        // Não mostra erro para o usuário para não atrapalhar a experiência
    }
}

// Mostrar mensagem de sucesso
function showSuccessMessage() {
    const documentsContainer = document.getElementById('documentsContainer');
    if (!documentsContainer) return;
    
    // Remove mensagens de sucesso anteriores
    document.querySelectorAll('.success-message').forEach(el => el.remove());
    
    const successMessage = document.createElement('div');
    successMessage.className = 'success-message active';
    successMessage.innerHTML = `
        <div class="success-icon">
            <i class="fas fa-check-circle"></i>
        </div>
        <h2 class="success-title">SUCESSO!</h2>
        <p class="success-text">Seus documentos estão logo abaixo.</p>
        `;
    
    // Inserir antes da seção de documentos
    documentsContainer.parentNode.insertBefore(successMessage, documentsContainer);
}

// Scroll para o formulário
function scrollToForm() {
    document.querySelector('.form-container').scrollIntoView({ behavior: 'smooth' });
}

// Sistema de backgrounds com bolinhas
function initBackgroundSelectors() {
    createBackgroundSelector('carteira_frente', 'colorOptionsFrente');
    createBackgroundSelector('carteira_verso', 'colorOptionsVerso');
    createBackgroundSelector('vacina', 'colorOptionsVacina');
    createBackgroundSelector('certidao', 'colorOptionsCertidao');
    createBackgroundSelector('medicacao', 'colorOptionsMedicacao');
    createBackgroundSelector('peso', 'colorOptionsPeso');
}

function createBackgroundSelector(documentKey, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = '';
    const backgroundList = backgrounds[documentKey];

    backgroundList.forEach((bg, index) => {
        const colorOption = document.createElement('div');
        colorOption.className = 'color-option';
        colorOption.style.backgroundColor = bg.color;
        colorOption.dataset.image = bg.image;
        colorOption.dataset.document = documentKey;

        if (currentBackgrounds[documentKey] === bg.image) {
            colorOption.classList.add('active');
        }

        colorOption.addEventListener('click', function() {
            container.querySelectorAll('.color-option').forEach(opt => {
                opt.classList.remove('active');
            });
            this.classList.add('active');

            currentBackgrounds[documentKey] = bg.image;
            renderSpecificCanvas(documentKey);
            
            showQuickNotification('Fundo alterado!', 'success');
        });

        container.appendChild(colorOption);
    });
}

// Renderização dos canvas
function renderAllCanvases() {
    renderSpecificCanvas('carteira_frente');
    renderSpecificCanvas('carteira_verso');
    renderSpecificCanvas('vacina');
    renderSpecificCanvas('certidao');
    renderSpecificCanvas('medicacao');
    renderSpecificCanvas('peso');
    renderTimeCanvas();
    renderMarcador();
    renderPolaroid();
    renderPortaRetrato();
}

function renderSpecificCanvas(documentKey) {
    let canvas, width, height;
    
    switch(documentKey) {
        case 'carteira_frente':
            canvas = document.getElementById('carteiraFrenteCanvas');
            width = 1134;
            height = 768;
            break;
        case 'carteira_verso':
            canvas = document.getElementById('carteiraVersoCanvas');
            width = 1134;
            height = 768;
            break;
        case 'vacina':
            canvas = document.getElementById('vacinaCanvas');
            width = 1134;
            height = 768;
            break;
        case 'certidao':
            canvas = document.getElementById('certidaoCanvas');
            width = 768;
            height = 1134;
            break;
        case 'medicacao':
            canvas = document.getElementById('controleMedicacaoCanvas');
            width = 768;
            height = 1134;
            break;
        case 'peso':
            canvas = document.getElementById('controlePesoCanvas');
            width = 768;
            height = 1134;
            break;
        default:
            return;
    }
    
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    canvas.width = width;
    canvas.height = height;
    
    ctx.clearRect(0, 0, width, height);
    
    const backgroundImg = new Image();
    backgroundImg.onload = function() {
        ctx.drawImage(backgroundImg, 0, 0, width, height);
        
        // Adicionar conteúdo específico do canvas
        switch(documentKey) {
            case 'carteira_frente':
                drawCarteiraFrente(ctx, canvas);
                break;
            case 'carteira_verso':
                drawCarteiraVerso(ctx, canvas);
                break;
            case 'vacina':
                drawVacinaContent(ctx, canvas);
                break;
            case 'certidao':
                drawCertidaoContent(ctx, canvas);
                break;
            case 'medicacao':
                drawControleMedicacao(ctx, canvas);
                break;
            case 'peso':
                drawControlePeso(ctx, canvas);
                break;
        }
        
        // Adicionar marca d'água APÓS desenhar todo o conteúdo
        addWatermark(ctx, canvas);
    };
    backgroundImg.onerror = function() {
        console.error('Erro ao carregar background:', currentBackgrounds[documentKey]);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, width, height);
        addWatermark(ctx, canvas);
    };
    backgroundImg.src = currentBackgrounds[documentKey];
}

// Função para adicionar marca d'água sobreposta em TODOS os canvas
function addWatermark(ctx, canvas) {
    createWatermarkOverlay(canvas);
}

// Nova função para criar overlay de marca d'água
function createWatermarkOverlay(canvas) {
    const canvasContainer = canvas.parentElement;
    if (!canvasContainer) return;
    
    // Remove marca d'água anterior se existir
    const existingWatermark = canvasContainer.querySelector('.watermark-overlay');
    if (existingWatermark) {
        existingWatermark.remove();
    }
    
    // Cria o elemento overlay
    const watermark = document.createElement('div');
    watermark.className = 'watermark-overlay';
    watermark.innerHTML = 'RG DO PET';
    
    // Estiliza o overlay
    watermark.style.cssText = `
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 120px;
        font-weight: bold;
        color: rgba(255, 0, 0, 0.3);
        pointer-events: none;
        z-index: 1000000;
        transform: rotate(-45deg);
        font-family: Arial, sans-serif;
        text-align: center;
    `;
    
    // Adiciona o overlay ao container do canvas
    canvasContainer.style.position = 'relative';
    canvasContainer.appendChild(watermark);
}

// Canvas do Time do Coração
function renderTimeCanvas() {
    const canvas = document.getElementById('timeCanvas');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    canvas.width = 1134;
    canvas.height = 768;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    const background = new Image();
    
    // Mapeamento dos times com as imagens originais
    const timeImages = {
        'flamengo': 'img/a3.png',
        'santos': 'img/a4.png',
        'botafogo': 'img/a5.png',
        'corinthians': 'img/a6.png',
        'vitoria': 'img/a7.png',
        'cruzeiro': 'img/a8.png',
        'atletico_mineiro': 'img/a9.png',
        'fluminense': 'img/a10.png',
        'gremio': 'img/a11.png',
        'vasco': 'img/a12.png',
        'palmeiras': 'img/a13.png',
        'saopaulo': 'img/a14.png',
        'nenhum_time': 'img/a19.png'
    };
    
    background.src = timeImages[formData.time] || 'img/a19.png';
    
    background.onload = function() {
        ctx.drawImage(background, 0, 0, canvas.width, canvas.height);
        
        // Adicionar marca d'água
        addWatermark(ctx, canvas);
        
        if (formData.foto) {
            const reader = new FileReader();
            reader.onload = function(event) {
                const img = new Image();
                img.onload = function() {
                    const imgWidth = 339 * 0.8;
                    const imgHeight = 445 * 0.8;
                    
                    const imgX = canvas.width - imgHeight - 117;
                    const imgY = (canvas.height - imgWidth) / 2;
                    
                    ctx.save();
                    ctx.translate(imgX + imgHeight / 2, imgY + imgWidth / 2);
                    ctx.rotate(0);
                    ctx.drawImage(img, -imgWidth / 2, -imgHeight / 2, imgWidth, imgHeight);
                    ctx.restore();
                };
                img.src = event.target.result;
            };
            reader.readAsDataURL(formData.foto);
        }
        
        // Adiciona o nome
        if (formData.nome) {
            ctx.save();
            ctx.textAlign = 'center';
            ctx.font = '60px Vibur';
            ctx.fillStyle = "#ecf2fa";
            const nomeFormatado = formatarNome(formData.nome);
            ctx.fillText(nomeFormatado, canvas.width / 2, canvas.height / 2 + 265);
            ctx.restore();
        }
    };
}

// Marcador de Página
function renderMarcador() {
    const canvas = document.getElementById('marcadorCanvas');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    canvas.width = 868;
    canvas.height = 1234;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    const background = new Image();
    background.src = 'img/b3.png';
    
    background.onload = function() {
        ctx.drawImage(background, 0, 0, canvas.width, canvas.height);
        
        // Adicionar marca d'água
        addWatermark(ctx, canvas);
        
        if (formData.foto) {
            const reader = new FileReader();
            reader.onload = function(event) {
                const img = new Image();
                img.onload = function() {
                    const imgDiameter = 220;
                    const margin = 70;
                    const totalFotos = 3;
                    const startX = (canvas.width - (totalFotos * imgDiameter + (totalFotos - 1) * margin)) / 2;
                    const centerY = (canvas.height / 4) - (imgDiameter / 4);

                    for (let col = 0; col < totalFotos; col++) {
                        const centerX = startX + col * (imgDiameter + margin);

                        ctx.save();
                        ctx.beginPath();
                        ctx.arc(centerX + imgDiameter / 2, centerY + imgDiameter / 2, imgDiameter / 2, 0, Math.PI * 2);
                        ctx.clip();
                        ctx.drawImage(img, centerX, centerY, imgDiameter, imgDiameter);
                        ctx.restore();
                    }
                };
                img.src = event.target.result;
            };
            reader.readAsDataURL(formData.foto);
        }
    };
}

// Fotos Polaroid
function renderPolaroid() {
    const canvas = document.getElementById('polaroidCanvas');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    canvas.width = 1134;
    canvas.height = 868;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    const background = new Image();
    background.src = 'img/b2.png';
    
    background.onload = function() {
        ctx.drawImage(background, 0, 0, canvas.width, canvas.height);
        
        // Adicionar marca d'água
        addWatermark(ctx, canvas);
        
        if (formData.foto) {
            const reader = new FileReader();
            reader.onload = function(event) {
                const img = new Image();
                img.onload = function() {
                    const imgWidth = 240;
                    const imgHeight = 290;
                    const margin = 100;
                    const columns = Math.floor(canvas.width / (imgWidth + margin));
                    const rows = Math.floor(canvas.height / (imgHeight + margin));

                    for (let row = 0; row < rows; row++) {
                        for (let col = 0; col < columns; col++) {
                            const x = col * (imgWidth + margin) + margin;
                            const y = row * (imgHeight + margin) + margin;
                            ctx.drawImage(img, x, y, imgWidth, imgHeight);
                        }
                    }
                };
                img.src = event.target.result;
            };
            reader.readAsDataURL(formData.foto);
        }
    };
}

// Porta Retrato
function renderPortaRetrato() {
    const canvas = document.getElementById('carteiraSetimaCanvas');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    canvas.width = 768;
    canvas.height = 1134;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    const background = new Image();
    background.src = formData.sexo === 'feminino' ? 'img/1.jpg' : 'img/2.jpg';
    
    background.onload = function() {
        ctx.drawImage(background, 0, 0, canvas.width, canvas.height);
        
        // Adicionar marca d'água
        addWatermark(ctx, canvas);
        
        if (formData.foto) {
            const reader = new FileReader();
            reader.onload = function(event) {
                const img = new Image();
                img.onload = function() {
                    const imgWidth = 379 * 1.5;
                    const imgHeight = 485 * 1.5;

                    const imgX = (canvas.width - imgHeight) / 2;
                    const imgY = (canvas.height - imgWidth) / 2 - 98;

                    ctx.save();
                    ctx.translate(imgX + imgHeight / 2, imgY + imgWidth / 2);
                    ctx.rotate(0);
                    ctx.drawImage(img, -imgWidth / 2, -imgHeight / 2, imgWidth, imgHeight);
                    ctx.restore();
                };
                img.src = event.target.result;
            };
            reader.readAsDataURL(formData.foto);
        }

        // Adiciona o nome
        if (formData.nome) {
            ctx.save();
            ctx.textAlign = 'center';
            ctx.font = '40px Vibur';
            ctx.fillStyle = '#18262C';
            const nomeFormatado = formatarNome(formData.nome);
            ctx.fillText(nomeFormatado, canvas.width / 2, canvas.height / 2 + 550);
            ctx.restore();
        }
    };
}

// CONTROLE DE MEDICAÇÃO
function drawControleMedicacao(ctx, canvas) {
    if (formData.foto) {
        const reader = new FileReader();
        reader.onload = function(event) {
            const img = new Image();
            img.onload = function() {
                const imgWidth = 339 * 0.58;
                const imgHeight = 445 * 0.58;

                const imgX = canvas.width - imgHeight - 2;
                const imgY = (canvas.height - imgWidth) / 2 - 410;

                ctx.save();
                ctx.translate(imgX + imgHeight / 2, imgY + imgWidth / 2);
                ctx.rotate(0);
                ctx.drawImage(img, -imgWidth / 2, -imgHeight / 2, imgWidth, imgHeight);
                ctx.restore();
            };
            img.src = event.target.result;
        };
        reader.readAsDataURL(formData.foto);
    }

    // Adiciona o nome
    if (formData.nome) {
        ctx.save();
        ctx.textAlign = 'center';
        ctx.font = '35px Vibur';
        ctx.fillStyle = '#00008B';
        const nomeFormatado = formatarNome(formData.nome);
        ctx.fillText(nomeFormatado, canvas.width / 2 - 130, canvas.height / 2 - 280);
        ctx.restore();
    }
}

// CONTROLE DE PESO
function drawControlePeso(ctx, canvas) {
    if (formData.foto) {
        const reader = new FileReader();
        reader.onload = function(event) {
            const img = new Image();
            img.onload = function() {
                const imgWidth = 339 * 0.58;
                const imgHeight = 445 * 0.58;

                const imgX = canvas.width - imgHeight - 1;
                const imgY = (canvas.height - imgWidth) / 2 - 415;

                ctx.save();
                ctx.translate(imgX + imgHeight / 2, imgY + imgWidth / 2);
                ctx.rotate(0);
                ctx.drawImage(img, -imgWidth / 2, -imgHeight / 2, imgWidth, imgHeight);
                ctx.restore();
            };
            img.src = event.target.result;
        };
        reader.readAsDataURL(formData.foto);
    }

    // Adiciona o nome
    if (formData.nome) {
        ctx.save();
        ctx.textAlign = 'center';
        ctx.font = '38px Vibur';
        ctx.fillStyle = '#00008B';
        const nomeFormatado = formatarNome(formData.nome);
        ctx.fillText(nomeFormatado, canvas.width / 2 - 120, canvas.height / 2 - 280);
        ctx.restore();
    }
}

// Funções de desenho originais
function drawCarteiraFrente(ctx, canvas) {
    if (formData.nome) {
        ctx.save();
        ctx.textAlign = 'center';
        ctx.font = 'bold 60px Vibur';
        ctx.fillStyle = '#00008B';
        const nomeFormatado = formatarNome(formData.nome);
        ctx.fillText(nomeFormatado, canvas.width / 2, canvas.height / 2 + 265);
        ctx.restore();
    }
    
    if (formData.foto) {
        const reader = new FileReader();
        reader.onload = function(event) {
            const img = new Image();
            img.onload = function() {
                const imgWidth = 339 * 0.9;
                const imgHeight = 445 * 0.9;
                
                const imgX = canvas.width - imgHeight - 155;
                const imgY = (canvas.height - imgWidth) / 2;
                
                ctx.save();
                ctx.translate(imgX + imgHeight / 2, imgY + imgWidth / 2);
                ctx.rotate(Math.PI / 2);
                ctx.drawImage(img, -imgWidth / 2, -imgHeight / 2, imgWidth, imgHeight);
                ctx.restore();
            };
            img.src = event.target.result;
        };
        reader.readAsDataURL(formData.foto);
    }
}

function drawCarteiraVerso(ctx, canvas) {
    const info = [
        { label: 'Nome do Tutor(a):', value: formData.nomeTutor },
        { label: 'Data de Nascimento:', value: formData.dataNascimento },
        { label: 'Estado:', value: formData.estado },
        { label: 'Cidade:', value: formData.cidade },
        { label: 'Bairro:', value: formData.bairro },
        { label: 'Rua:', value: formData.rua },
        { label: 'N° Casa:', value: formData.numeroCasa },
        { label: 'Raça:', value: formData.raca },
        { label: 'Cor:', value: formData.cor },
        { label: 'Contato Tutor:', value: formData.contatoTutor }
    ];

    const columnWidth = canvas.width / 2.0;
    const rowHeight = 120;

    ctx.save();
    ctx.font = 'bold 34px Arial';
    ctx.fillStyle = '#353535';

    info.forEach((item, index) => {
        const column = index % 2 === 0 ? 0 : 1;
        const row = Math.floor(index / 2);

        const labelX = column * columnWidth + 110;
        const labelY = row * rowHeight + 150;
        const valueX = labelX;
        const valueY = labelY + 45;

        ctx.fillText(item.label, labelX, labelY);
        
        if (item.value && item.value.trim() !== '') {
            ctx.fillText(item.value.toUpperCase(), valueX, valueY);
        }
    });

    ctx.restore();
}

function drawVacinaContent(ctx, canvas) {
    if (formData.foto) {
        const reader = new FileReader();
        reader.onload = function(event) {
            const img = new Image();
            img.onload = function() {
                const imgWidth = 339 * 0.4;
                const imgHeight = 445 * 0.4;

                const imgX = canvas.width - imgHeight - 70;
                const imgY = (canvas.height - imgWidth) / 2 - 200;

                ctx.save();
                ctx.translate(imgX + imgHeight / 2, imgY + imgWidth / 2);
                ctx.rotate(0);
                ctx.drawImage(img, -imgWidth / 2, -imgHeight / 2, imgWidth, imgHeight);
                ctx.restore();
            };
            img.src = event.target.result;
        };
        reader.readAsDataURL(formData.foto);
    }

    if (formData.nome) {
        ctx.save();
        ctx.textAlign = 'center';
        ctx.font = '29px Vibur';
        ctx.fillStyle = '#00008B';
        const nomeFormatado = formatarNome(formData.nome);
        ctx.fillText(nomeFormatado, canvas.width / 2 + 150, canvas.height / 2 - 234);
        ctx.restore();
    }

    if (formData.sexo) {
        ctx.save();
        ctx.textAlign = 'center';
        ctx.font = '29px Vibur';
        ctx.fillStyle = '#00008B';
        ctx.fillText(formData.sexo, canvas.width / 2 + 105, canvas.height / 2 - 175);
        ctx.restore();
    }

    if (formData.raca) {
        ctx.save();
        ctx.textAlign = 'center';
        ctx.font = '29px Vibur';
        ctx.fillStyle = '#00008B';
        ctx.fillText(formData.raca, canvas.width / 2 + 250, canvas.height / 2 - 175);
        ctx.restore();
    }

    if (formData.nomeTutor) {
        ctx.save();
        ctx.textAlign = 'center';
        ctx.font = '29px Vibur';
        ctx.fillStyle = '#00008B';
        const tutorFormatado = formatarNome(formData.nomeTutor);
        ctx.fillText(tutorFormatado, canvas.width / 2 + 150, canvas.height / 2 - 120);
        ctx.restore();
    }

    if (formData.contatoTutor) {
        ctx.save();
        ctx.textAlign = 'center';
        ctx.font = '23px Vibur';
        ctx.fillStyle = '#00008B';
        ctx.fillText(formData.contatoTutor, canvas.width / 2 + 110, canvas.height / 2 - 70);
        ctx.restore();
    }
}

function drawCertidaoContent(ctx, canvas) {
    if (formData.foto) {
        const reader = new FileReader();
        reader.onload = function(event) {
            const img = new Image();
            img.onload = function() {
                const imgWidth = 339 * 0.5;
                const imgHeight = 445 * 0.5;

                const imgX = canvas.width - imgHeight - 497;
                const imgY = (canvas.height - imgWidth) / 2 - 170;

                ctx.save();
                ctx.translate(imgX + imgHeight / 2, imgY + imgWidth / 2);
                ctx.rotate(0);
                ctx.drawImage(img, -imgWidth / 2, -imgHeight / 2, imgWidth, imgHeight);
                ctx.restore();
            };
            img.src = event.target.result;
        };
        reader.readAsDataURL(formData.foto);
    }

    if (formData.nome) {
        ctx.save();
        ctx.textAlign = 'center';
        ctx.font = '30px Vibur';
        ctx.fillStyle = '#00008B';
        const nomeFormatado = formatarNome(formData.nome);
        ctx.fillText(nomeFormatado, canvas.width / 2 - 130, canvas.height / 2 - 15);
        ctx.restore();
    }

    if (formData.rua) {
        ctx.save();
        ctx.textAlign = 'center';
        ctx.font = '30px Vibur';
        ctx.fillStyle = '#00008B';
        ctx.fillText(formData.rua, canvas.width / 2 + 20, canvas.height / 2 - 239);
        ctx.restore();
    }

   if (formData.numeroCasa) {
        ctx.save();
        ctx.textAlign = 'center';
        ctx.font = '30px Vibur';
        ctx.fillStyle = '#00008B';
        ctx.fillText(formData.numeroCasa, canvas.width / 2 - 10, canvas.height / 2 - 130);
        ctx.restore();
    }

    if (formData.sexo) {
        ctx.save();
        ctx.textAlign = 'center';
        ctx.font = '30px Vibur';
        ctx.fillStyle = '#00008B';
        ctx.fillText(formData.sexo, canvas.width / 2 + 210, canvas.height / 2 - 130);
        ctx.restore();
    }

    if (formData.raca) {
        ctx.save();
        ctx.textAlign = 'center';
        ctx.font = '30px Vibur';
        ctx.fillStyle = '#00008B';
        ctx.fillText(formData.raca, canvas.width / 2 + 20, canvas.height / 2 - 180);
        ctx.restore();
    }

    if (formData.estado) {
        ctx.save();
        ctx.textAlign = 'center';
        ctx.font = '30px Vibur';
        ctx.fillStyle = '#00008B';
        ctx.fillText(formData.estado, canvas.width / 2 + 200, canvas.height / 2 - 70);
        ctx.restore();
    }

    if (formData.cor) {
        ctx.save();
        ctx.textAlign = 'center';
        ctx.font = '30px Vibur';
        ctx.fillStyle = '#00008B';
        ctx.fillText(formData.cor, canvas.width / 2 - 200, canvas.height / 2 + 40);
        ctx.restore();
    }

    if (formData.nomeTutor) {
        ctx.save();
        ctx.textAlign = 'center';
        ctx.font = '30px Vibur';
        ctx.fillStyle = '#00008B';
        const tutorFormatado = formatarNome(formData.nomeTutor);
        ctx.fillText(tutorFormatado, canvas.width / 2 - 110, canvas.height / 2 + 99);
        ctx.restore();
    }

    if (formData.cidade) {
        ctx.save();
        ctx.textAlign = 'center';
        ctx.font = '30px Vibur';
        ctx.fillStyle = '#00008B';
        ctx.fillText(formData.cidade, canvas.width / 2, canvas.height / 2 - 70);
        ctx.restore();
    }
}

// Funções para integração de Cards Interativos
function setupQuizOptions(containerId, targetSelectId) {
    const container = document.getElementById(containerId);
    const targetSelect = document.getElementById(targetSelectId);

    if (!container || !targetSelect) return;

    container.addEventListener('click', (event) => {
        const option = event.target.closest('.quiz-option');
        if (!option) return;

        container.querySelectorAll('.quiz-option').forEach(opt => {
            opt.classList.remove('active');
        });

        option.classList.add('active');

        const selectedValue = option.getAttribute('data-value');
        targetSelect.value = selectedValue;

        targetSelect.dispatchEvent(new Event('change'));
    });

    const initialValue = targetSelect.value;
    if (initialValue) {
        const initialOption = container.querySelector(`.quiz-option[data-value="${initialValue}"]`);
        if (initialOption) {
            initialOption.classList.add('active');
        }
    }
}

// Notificação rápida
function showQuickNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#27ae60' : type === 'error' ? '#e74c3c' : '#3498db'};
        color: white;
        padding: 12px 20px;
        border-radius: 8px;
        box-shadow: 0 5px 15px rgba(0,0,0,0.2);
        z-index: 1000;
        font-weight: 600;
        animation: slideInRight 0.3s ease;
    `;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => {
            if (notification.parentNode) {
                document.body.removeChild(notification);
            }
        }, 300);
    }, 2000);
}

// Adicionar CSS para animações
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOutRight {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// Debug helper
window.debugFormData = function() {
    console.log('=== DEBUG FORM DATA ===');
    console.log('Current Step:', currentStep);
    console.log('Form Data:', formData);
    console.log('Backgrounds:', currentBackgrounds);
    console.log('=======================');
};

console.log('🚀 Script.js carregado - Fullstack Mode!');
