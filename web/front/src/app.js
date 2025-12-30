import { state } from './modules/state.js';
import * as api from './modules/api.js';
import * as ui from './modules/ui.js';

// --- Initialization ---

async function initApp() {
    ui.initDomElements();
    
    // Setup Initial Event Listeners
    window.showList = showList; // Used by back button

    // Load content
    showList();
}

// --- Logic Handlers ---

async function showList() {
    try {
        const response = await api.fetchAnimations();
        state.currentAnimations = response.data || [];
    } catch (e) {
        console.error('Fetch error:', e);
        // Even if fetch fails, we want to show the list view (empty) so user can see buttons
        state.currentAnimations = [];
    } finally {
        ui.switchView(ui.elements.listView);
        renderCurrentList();
    }
}

function renderCurrentList() {
    ui.renderList(state, {
        onDetail: showDetail,
        onPageChange: (p) => {
            state.currentPage = p;
            renderCurrentList();
        }
    });
}

async function showDetail(aid) {
    try {
        const response = await api.fetchAnimationDetail(aid);
        const detail = response.data;
        
        if (!detail) throw new Error('No data in response');

        ui.elements.detailImage.src = detail.cover_path || detail.cover || 'https://via.placeholder.com/600x400?text=No+Image';
        ui.elements.detailTitle.innerText = detail.name;
        
        // 构建详细信息HTML
        let infoHtml = '';
        if (detail.company && detail.company.name) {
            infoHtml += `<p><strong>制作公司:</strong> ${detail.company.name}`;
            if (detail.company.address) infoHtml += `&emsp;&emsp;<strong>地区：</strong>${detail.company.address}`;
            if (detail.company.president) infoHtml += `&emsp;&emsp;<strong>制作人：</strong>${detail.company.president}`;
            infoHtml += `</p>`;
        }
        if (detail.season) infoHtml += `<p><strong>季度:</strong> ${detail.season}</p>`;
        if (detail.genres && detail.genres.length > 0) infoHtml += `<p><strong>类型:</strong> ${detail.genres.join(', ')}</p>`;
        if (detail.introduction) infoHtml += `<p><strong>简介:</strong> ${detail.introduction}</p>`;

        ui.elements.detailDesc.innerHTML = infoHtml;
        
        // 渲染角色信息
        if (ui.elements.characterGrid) {
            ui.elements.characterGrid.innerHTML = ''; // 清空之前的内容
            
            if (detail.characters && detail.characters.length > 0) {
                // 显示标题
                if (ui.elements.charTitle) ui.elements.charTitle.style.display = 'block';

                detail.characters.forEach(char => {
                    const charCard = document.createElement('div');
                    charCard.className = 'char-card'; // Use CSS class defined in index.html

                    const charImgSrc = char.cover_path || char.cover || 'https://via.placeholder.com/150x120?text=No+Img';
                    
                    let charInfo = `<div style="font-weight:bold; margin:5px 0;">${char.name}</div>`;
                    if (char.sex) charInfo += `<div style="font-size:12px; color:#666;">${char.sex}</div>`;
                    
                    // CV 信息
                    if (char.voice_actor) {
                        charInfo += `<div style="font-size:12px; color:#666; margin-top:5px;">CV: ${char.voice_actor}</div>`;
                    }

                    charCard.innerHTML = `
                        <img src="${charImgSrc}" alt="${char.name}">
                        ${charInfo}
                    `;
                    ui.elements.characterGrid.appendChild(charCard);
                });
            } else {
                if (ui.elements.charTitle) ui.elements.charTitle.style.display = 'none';
            }
        }

        ui.switchView(ui.elements.detailView);
    } catch (e) {
        console.error('Fetch detail error:', e);
        alert('获取详情失败');
    }
}

// Start
document.addEventListener('DOMContentLoaded', initApp);
