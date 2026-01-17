import { PAGE_SIZE } from './config.js';

export const elements = {
    listView: null,
    detailView: null,
    imageGrid: null,
    pagination: null,
    detailImage: null,
    detailTitle: null,
    detailDesc: null,
    characterGrid: null,
    charTitle: null,
    charModal: null,
    charModalImage: null,
    charModalName: null,
    charModalInfo: null
};

export function initDomElements() {
    elements.listView = document.getElementById('listView');
    elements.detailView = document.getElementById('detailView');
    elements.imageGrid = document.getElementById('imageGrid');
    elements.pagination = document.getElementById('pagination');
    
    elements.detailImage = document.getElementById('detailImage');
    elements.detailTitle = document.getElementById('detailTitle');
    elements.detailDesc = document.getElementById('detailDesc');
    elements.characterGrid = document.getElementById('characterGrid');
    elements.charTitle = document.getElementById('charTitle');

    elements.charModal = document.getElementById('charModal');
    elements.charModalImage = document.getElementById('charModalImage');
    elements.charModalName = document.getElementById('charModalName');
    elements.charModalInfo = document.getElementById('charModalInfo');

    const closeBtn = document.getElementById('charModalClose');
    if (closeBtn) closeBtn.onclick = hideCharacterModal;
    if (elements.charModal) {
        elements.charModal.addEventListener('click', (e) => {
            if (e.target === elements.charModal) hideCharacterModal();
        });
    }
}

export function switchView(targetView) {
    [elements.listView, elements.detailView].forEach(view => {
        if (view) view.classList.remove('active');
    });
    if (targetView) targetView.classList.add('active');
}

export function renderList(state, handlers) {
    const { currentAnimations, currentPage } = state;
    const { onDetail, onPageChange } = handlers;
    
    elements.imageGrid.innerHTML = '';
    elements.pagination.innerHTML = '';
    
    const totalItems = currentAnimations.length;
    
    if (totalItems === 0) {
        elements.imageGrid.innerHTML = '<div style="grid-column: 1/-1; text-align: center; color: #999; padding: 50px;">暂无内容。</div>';
        return;
    }

    const totalPages = Math.max(1, Math.ceil(totalItems / PAGE_SIZE));
    const safePage = Math.min(Math.max(currentPage, 1), totalPages);
    
    const startIndex = (safePage - 1) * PAGE_SIZE;
    const endIndex = Math.min(startIndex + PAGE_SIZE, totalItems);

    for (let i = startIndex; i < endIndex; i++) {
        if (i < currentAnimations.length) {
            const item = currentAnimations[i];
            const card = document.createElement('div');
            card.className = 'image-card';
            card.onclick = () => onDetail(item.aid);
            
            let genreText = '未知类型';
            if (Array.isArray(item.genres)) {
                genreText = item.genres.join(' / ');
            } else if (typeof item.genres === 'string') {
                genreText = item.genres;
            }
            
            card.innerHTML = `
                <img src="${item.cover_path || item.cover}" alt="${item.name}" onerror="this.src='https://via.placeholder.com/200x150?text=No+Image'">
                <div class="genre-overlay">${genreText}</div>
                <div class="title">${item.name}</div>
            `;
            elements.imageGrid.appendChild(card);
        }
    }

    if (totalPages > 1) {
        const createBtn = (text, disabled, page) => {
            const btn = document.createElement('button');
            btn.className = 'page-btn';
            if (page === safePage) btn.classList.add('active');
            btn.innerText = text;
            btn.disabled = disabled;
            btn.onclick = () => onPageChange(page);
            return btn;
        };

        elements.pagination.appendChild(createBtn('<', safePage === 1, safePage - 1));
        
        for (let p = 1; p <= totalPages; p++) {
            elements.pagination.appendChild(createBtn(p, false, p));
        }

        elements.pagination.appendChild(createBtn('>', safePage === totalPages, safePage + 1));
    }
}

export function renderDetail(data, onBack) {
    elements.detailImage.src = data.cover_path || data.cover;
    elements.detailImage.onerror = function() {
        this.src = 'https://via.placeholder.com/600x400?text=No+Image';
    };
    elements.detailTitle.textContent = data.name;
    elements.detailDesc.innerHTML = `<strong>播出时间:</strong> ${data.season || '未知'}<br><br>${data.introduction || '暂无简介'}`;
    
    elements.characterGrid.innerHTML = '';
    if (data.characters && data.characters.length > 0) {
        data.characters.forEach(char => {
            const charCard = document.createElement('div');
            charCard.className = 'char-card';
            charCard.innerHTML = `
                <img src="${char.cover_path || char.cover}" alt="${char.name}" onerror="this.src='https://via.placeholder.com/150x220?text=No+Img'">
                <div style="font-weight:bold; margin-top:5px; font-size:14px;">${char.name}</div>
            `;
            elements.characterGrid.appendChild(charCard);
        });
    } else {
        elements.characterGrid.innerHTML = '<div style="grid-column: 1/-1; text-align: center; color: #999;">暂无角色信息</div>';
    }

    // Ensure back button works
    const backBtn = elements.detailView.querySelector('.back-btn');
    if (backBtn) backBtn.onclick = onBack;

    switchView(elements.detailView);
}

export function showCharacterModal(char) {
    if (!elements.charModal) return;
    elements.charModal.style.display = 'flex';

    if (elements.charModalImage) {
        elements.charModalImage.src = char.cover_path || char.cover || 'https://via.placeholder.com/300x400?text=No+Img';
    }

    if (elements.charModalName) {
        elements.charModalName.textContent = char.name || '';
    }

    if (elements.charModalInfo) {
        const parts = [];
        if (char.sex) parts.push('性别：' + char.sex);
        if (char.voice_actor) {
            let cv = 'CV：' + char.voice_actor;
            if (char.voice_actor_age) cv += '（' + char.voice_actor_age + '岁）';
            parts.push(cv);
        }
        if (char.personality) parts.push('性格：' + char.personality);
        elements.charModalInfo.textContent = parts.join(' | ');
    }
}

export function hideCharacterModal() {
    if (elements.charModal) {
        elements.charModal.style.display = 'none';
    }
}
