document.addEventListener('DOMContentLoaded', () => {
    const state = {
        modules: [],
        userProgress: {
            unlockedModules: ['module-1'],
            completedModules: [],
            quizScores: {},
            workshopAnswers: {}
        },
        currentModule: null
    };

    const mainContent = document.getElementById('main-content');
    const moduleNav = document.getElementById('module-nav');
    const progressBar = document.querySelector('.progress-bar');
    const progressText = document.querySelector('.progress-text');

    async function init() {
        loadProgress();
        try {
            const response = await fetch('data/modules.json');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            state.modules = await response.json();
        } catch (error) {
            console.error("Error loading or parsing modules:", error);
            if(moduleNav) {
                moduleNav.innerHTML = `<div style="padding: 1rem; color: white; background-color: #e74c3c; border-radius: 8px;"><strong>Error:</strong> No se pudieron cargar los módulos. <br><br>Asegúrate de que el archivo 'data/modules.json' existe y no tiene errores de sintaxis.</div>`;
            }
            return;
        }
        renderSidebar();
        renderWelcomeScreen();
    }

    function saveProgress() {
        localStorage.setItem('userProgress', JSON.stringify(state.userProgress));
    }

    function loadProgress() {
        const savedProgress = localStorage.getItem('userProgress');
        if (savedProgress) {
            state.userProgress = JSON.parse(savedProgress);
        }
    }

    function renderSidebar() {
        if (!moduleNav) return;
        moduleNav.innerHTML = '';
        state.modules.forEach(module => {
            const item = document.createElement('div');
            item.id = module.id;
            item.textContent = module.title;
            item.classList.add('module-item');

            if (state.userProgress.unlockedModules.includes(module.id)) {
                item.classList.add('unlocked');
                item.addEventListener('click', () => selectModule(module.id));
            } else {
                item.classList.add('locked');
            }

            if (state.userProgress.completedModules.includes(module.id)) {
                item.classList.add('completed');
            }
            
            if (state.currentModule === module.id) {
                item.classList.add('active');
            }

            moduleNav.appendChild(item);
        });
        updateProgressBar();
    }
    
    function renderWelcomeScreen() {
        if (!mainContent) return;
        mainContent.innerHTML = `
            <section class="welcome-screen">
                <h2>Bienvenido al Taller de Liderazgo Interactivo</h2>
                <p>Basado en los principios de "El Camino del Despertar".</p>
                <p>Selecciona un módulo para iniciar tu transformación.</p>
            </section>
        `;
    }

    function selectModule(moduleId) {
        state.currentModule = moduleId;
        const module = state.modules.find(m => m.id === moduleId);
        if (module) {
            renderModule(module);
        }
        renderSidebar();
    }

    function renderModule(module) {
        if (!mainContent) return;

        state.userProgress.workshopAnswers = state.userProgress.workshopAnswers || {};
        state.userProgress.workshopAnswers[module.id] = state.userProgress.workshopAnswers[module.id] || {};

        mainContent.innerHTML = `
            <div class="module-content">
                <h2>${module.title}</h2>

                <section class="introduction" style="background-color: #f8f9fa; padding: 1.5rem; border-radius: 8px; margin-bottom: 2rem;">
                    <p style="font-style: italic; font-size: 1.1rem; text-align: center;">${module.introduction}</p>
                </section>

                <section class="core-principles">
                    <h3>Principios Fundamentales</h3>
                    ${module.corePrinciples.map(principle => `
                        <div class="principle" style="margin-bottom: 1rem;">
                            <h4>${principle.title}</h4>
                            <p>${principle.content}</p>
                        </div>
                    `).join('')}
                </section>

                <section class="action-workshop" style="background-color: var(--surface-color); padding: 2rem; border-radius: var(--border-radius); box-shadow: var(--shadow); margin-bottom: 2rem;">
                    <h3>${module.actionWorkshop.title}</h3>
                    ${module.actionWorkshop.steps.map((step, index) => `
                        <div class="workshop-step" style="margin-top: 1.5rem;">
                            <h4>Paso ${step.step}: ${step.title}</h4>
                            <p>${step.instruction}</p>
                            <textarea id="workshop-${module.id}-${index}" class="workshop-textarea" placeholder="Escribe tus notas y reflexiones para este paso..." style="width: 100%; min-height: 120px; padding: 1rem; border-radius: var(--border-radius); border: 1px solid var(--light-gray-color); font-family: var(--font-family); font-size: 1rem; resize: vertical; margin-top: 0.5rem;">${state.userProgress.workshopAnswers[module.id][index] || ''}</textarea>
                        </div>
                    `).join('')}
                </section>

                <section class="key-takeaways">
                    <h3>Ideas Clave para Recordar</h3>
                    <ul class="key-takeaways-list" style="list-style-type: square; padding-left: 20px;">
                        ${module.keyTakeaways.map(takeaway => `<li>${takeaway}</li>`).join('')}
                    </ul>
                </section>

                <section class="self-assessment" style="background-color: var(--surface-color); padding: 2rem; border-radius: var(--border-radius); box-shadow: var(--shadow); margin-bottom: 2rem; margin-top: 2rem;">
                    <h3>${module.selfAssessment.title}</h3>
                    <form id="quiz-form">
                        ${module.selfAssessment.questions.map((q, index) => `
                            <div class="quiz-question">
                                <p><strong>${index + 1}. ${q.question}</strong></p>
                                <ul class="quiz-options" data-question-index="${index}">
                                    ${q.options.map(option => `<li data-option="${option}">${option}</li>`).join('')}
                                </ul>
                            </div>
                        `).join('')}
                        <button type="submit" class="btn">Enviar Test</button>
                    </form>
                    <div id="quiz-result" class="quiz-result" style="display: none;"></div>
                </section>

                <section class="export">
                    <h3>Exportar Progreso</h3>
                    <p>Guarda las notas de tu taller y los resultados de este módulo.</p>
                    <button class="btn btn-export" id="export-btn">Exportar a JSON</button>
                </section>
            </div>
        `;
        addEventListenersToModule(module);
    }

    function addEventListenersToModule(module) {
        const quizForm = document.getElementById('quiz-form');
        if(quizForm) {
            quizForm.addEventListener('submit', (e) => handleQuizSubmit(e, module));
        }

        const optionsLists = document.querySelectorAll('.quiz-options');
        optionsLists.forEach(list => {
            list.addEventListener('click', (e) => {
                if (e.target.tagName === 'LI') {
                    [...list.children].forEach(child => child.classList.remove('selected'));
                    e.target.classList.add('selected');
                }
            });
        });
        
        const workshopTextareas = document.querySelectorAll('.workshop-textarea');
        workshopTextareas.forEach((textarea, index) => {
            textarea.addEventListener('input', () => {
                state.userProgress.workshopAnswers[module.id][index] = textarea.value;
                saveProgress();
            });
        });

        const exportBtn = document.getElementById('export-btn');
        if(exportBtn) {
            exportBtn.addEventListener('click', () => exportResults(module.id));
        }
    }

    function handleQuizSubmit(event, module) {
        event.preventDefault();
        const form = event.target;
        const userAnswers = [];
        const questions = form.querySelectorAll('.quiz-options');
        
        questions.forEach(questionElement => {
            const selectedOption = questionElement.querySelector('li.selected');
            userAnswers.push(selectedOption ? selectedOption.dataset.option : null);
        });

        let score = 0;
        module.selfAssessment.questions.forEach((q, index) => {
            if (userAnswers[index] === q.answer) {
                score++;
            }
        });

        const totalQuestions = module.selfAssessment.questions.length;
        const percentage = (score / totalQuestions) * 100;
        
        state.userProgress.quizScores[module.id] = percentage;
        saveProgress();

        const resultDiv = document.getElementById('quiz-result');
        if(!resultDiv) return;

        if (percentage >= 50) {
            resultDiv.innerHTML = `¡Felicidades! Has aprobado con un ${percentage.toFixed(0)}%. El siguiente módulo ha sido desbloqueado.`;
            resultDiv.className = 'quiz-result success';
            
            if (!state.userProgress.completedModules.includes(module.id)) {
                state.userProgress.completedModules.push(module.id);
            }

            const nextModuleIndex = state.modules.findIndex(m => m.id === module.id) + 1;
            if (nextModuleIndex < state.modules.length) {
                const nextModuleId = state.modules[nextModuleIndex].id;
                if (!state.userProgress.unlockedModules.includes(nextModuleId)) {
                    state.userProgress.unlockedModules.push(nextModuleId);
                }
            }
        } else {
            resultDiv.innerHTML = `Tu puntuación es ${percentage.toFixed(0)}%. Necesitas al menos 50% para aprobar. ¡Inténtalo de nuevo!`;
            resultDiv.className = 'quiz-result error';
        }
        
        resultDiv.style.display = 'block';
        saveProgress();
        renderSidebar();
    }
    
    function updateProgressBar() {
        if(!progressBar || !progressText) return;
        const completedCount = state.userProgress.completedModules.length;
        const totalModules = state.modules.length;
        const progress = totalModules > 0 ? (completedCount / totalModules) * 100 : 0;
        
        progressBar.style.width = `${progress}%`;
        progressText.textContent = `Progreso: ${progress.toFixed(0)}%`;
    }

    function exportResults(moduleId) {
        const module = state.modules.find(m => m.id === moduleId);
        if(!module) return;

        const workshopData = module.actionWorkshop.steps.map((step, index) => ({
            step: step.step,
            title: step.title,
            instruction: step.instruction,
            answer: state.userProgress.workshopAnswers[moduleId][index] || 'No hay respuesta guardada.'
        }));

        const dataToExport = {
            moduleTitle: module.title,
            workshop: workshopData,
            quizScore: state.userProgress.quizScores[moduleId] !== undefined ? `${state.userProgress.quizScores[moduleId].toFixed(0)}%` : 'No realizado.',
            exportedOn: new Date().toISOString()
        };

        const dataStr = JSON.stringify(dataToExport, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `taller-${moduleId}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }

    init();
});