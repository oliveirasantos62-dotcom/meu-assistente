import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

export const LANGUAGES = [
  { code: 'pt-BR', label: 'Português (Brasil)', flag: '🇧🇷' },
  { code: 'en-US', label: 'English (United States)', flag: '🇺🇸' },
  { code: 'es-ES', label: 'Español', flag: '🇪🇸' },
];

/*
 * The application has a lot of legacy JSX with Portuguese text directly in
 * components. Keeping every sentence in every component would make the
 * language feature fragile. This dictionary therefore has two layers:
 * 1) semantic keys used by newer components (t('nav.tasks'));
 * 2) UI text translations used by the language runtime below, which covers
 * legacy/static labels, placeholders, buttons, alerts and dashboard cards.
 */
const DICTIONARY = {
  'pt-BR': {
    'nav.dashboard': '🏠 Painel Principal', 'nav.tasks': '✅ Tarefas', 'nav.processos': '🧩 Processos',
    'nav.calendar': '📅 Calendário & Agenda', 'nav.diario': '📔 Diário', 'nav.estudos': '📚 Estudos',
    'nav.goals': '🎯 Objetivos', 'nav.habits': '🔥 Hábitos', 'nav.evolucao': '📈 Evolução & Progresso',
    'nav.projects': '📁 Projetos', 'nav.groups': '👥 Grupos', 'nav.collections': '🏆 Coleções & Conquistas',
    'nav.dataScience': '📊 Ciência de Dados', 'nav.reports': '📑 Relatórios', 'nav.tags': '🏷 Tags',
    'nav.gamification': '🎮 Gamificação', 'nav.finance': '💵 Finanças Pessoais', 'nav.investments': '📈 Investimentos',
    'nav.connections': '🤝 Conexões', 'nav.foguinho': '🔥 Foguinho', 'nav.assistant': '🤖 Assistente', 'nav.profile': '👤 Meu Perfil',
    'profile.account': 'MINHA CONTA', 'profile.title': 'Perfil',
    'profile.description': 'Altere seu nome, seu @ e o idioma do aplicativo sem perder conexões, projetos, grupos ou Foguinho.',
    'profile.name': 'Nome', 'profile.namePlaceholder': 'Seu nome', 'profile.username': 'Nome de usuário / @',
    'profile.usernameHelp': '3–30 caracteres: letras, números, ponto ou underline.', 'profile.email': 'E-mail',
    'profile.emailHelp': 'O e-mail não é alterado nesta tela.', 'profile.language': 'Idioma do aplicativo',
    'profile.languageHelp': 'A preferência fica salva neste dispositivo e será usada pelo aplicativo.',
    'profile.save': 'Salvar alterações', 'profile.saving': 'Salvando...', 'profile.saved': 'Perfil atualizado com sucesso.',
    'profile.nameRequired': 'Informe seu nome.', 'profile.usernameInvalid': 'O @ deve ter de 3 a 30 caracteres e usar apenas letras, números, ponto ou underline.',
    'profile.updateError': 'Não foi possível atualizar o perfil.', 'header.overview': 'Visão geral', 'header.focus': '🎯 Modo foco',
  },
  'en-US': {
    'nav.dashboard': '🏠 Dashboard', 'nav.tasks': '✅ Tasks', 'nav.processos': '🧩 Processes',
    'nav.calendar': '📅 Calendar & Agenda', 'nav.diario': '📔 Diary', 'nav.estudos': '📚 Studies',
    'nav.goals': '🎯 Goals', 'nav.habits': '🔥 Habits', 'nav.evolucao': '📈 Progress & Evolution',
    'nav.projects': '📁 Projects', 'nav.groups': '👥 Groups', 'nav.collections': '🏆 Collections & Achievements',
    'nav.dataScience': '📊 Data Science', 'nav.reports': '📑 Reports', 'nav.tags': '🏷 Tags',
    'nav.gamification': '🎮 Gamification', 'nav.finance': '💵 Personal Finance', 'nav.investments': '📈 Investments',
    'nav.connections': '🤝 Connections', 'nav.foguinho': '🔥 Streak', 'nav.assistant': '🤖 Assistant', 'nav.profile': '👤 My Profile',
    'profile.account': 'MY ACCOUNT', 'profile.title': 'Profile',
    'profile.description': 'Change your name, username and app language without losing connections, projects, groups or your streak.',
    'profile.name': 'Name', 'profile.namePlaceholder': 'Your name', 'profile.username': 'Username / @',
    'profile.usernameHelp': '3–30 characters: letters, numbers, dot or underscore.', 'profile.email': 'Email',
    'profile.emailHelp': 'Email cannot be changed on this screen.', 'profile.language': 'App language',
    'profile.languageHelp': 'Your preference is saved on this device and used by the app.',
    'profile.save': 'Save changes', 'profile.saving': 'Saving...', 'profile.saved': 'Profile updated successfully.',
    'profile.nameRequired': 'Enter your name.', 'profile.usernameInvalid': 'Username must contain 3–30 characters using only letters, numbers, dot or underscore.',
    'profile.updateError': 'Could not update your profile.', 'header.overview': 'Overview', 'header.focus': '🎯 Focus mode',
  },
  'es-ES': {
    'nav.dashboard': '🏠 Panel principal', 'nav.tasks': '✅ Tareas', 'nav.processos': '🧩 Procesos',
    'nav.calendar': '📅 Calendario y agenda', 'nav.diario': '📔 Diario', 'nav.estudos': '📚 Estudios',
    'nav.goals': '🎯 Objetivos', 'nav.habits': '🔥 Hábitos', 'nav.evolucao': '📈 Evolución y progreso',
    'nav.projects': '📁 Proyectos', 'nav.groups': '👥 Grupos', 'nav.collections': '🏆 Colecciones y logros',
    'nav.dataScience': '📊 Ciencia de datos', 'nav.reports': '📑 Informes', 'nav.tags': '🏷 Etiquetas',
    'nav.gamification': '🎮 Gamificación', 'nav.finance': '💵 Finanzas personales', 'nav.investments': '📈 Inversiones',
    'nav.connections': '🤝 Conexiones', 'nav.foguinho': '🔥 Racha', 'nav.assistant': '🤖 Asistente', 'nav.profile': '👤 Mi perfil',
    'profile.account': 'MI CUENTA', 'profile.title': 'Perfil',
    'profile.description': 'Cambia tu nombre, tu @ y el idioma de la aplicación sin perder conexiones, proyectos, grupos ni tu racha.',
    'profile.name': 'Nombre', 'profile.namePlaceholder': 'Tu nombre', 'profile.username': 'Nombre de usuario / @',
    'profile.usernameHelp': '3–30 caracteres: letras, números, punto o guion bajo.', 'profile.email': 'Correo electrónico',
    'profile.emailHelp': 'El correo no se puede cambiar en esta pantalla.', 'profile.language': 'Idioma de la aplicación',
    'profile.languageHelp': 'La preferencia se guarda en este dispositivo y la utiliza la aplicación.',
    'profile.save': 'Guardar cambios', 'profile.saving': 'Guardando...', 'profile.saved': 'Perfil actualizado correctamente.',
    'profile.nameRequired': 'Introduce tu nombre.', 'profile.usernameInvalid': 'El @ debe tener de 3 a 30 caracteres y usar solo letras, números, punto o guion bajo.',
    'profile.updateError': 'No se pudo actualizar el perfil.', 'header.overview': 'Resumen', 'header.focus': '🎯 Modo enfoque',
  },
};

const UI_TRANSLATIONS = {
  'Não foi possível verificar sua sessão.': ['Could not verify your session.', 'No se pudo verificar tu sesión.'],
  'Sua lista está pesada. Priorize apenas as 3 tarefas essenciais hoje.': ['Your list is heavy. Prioritize only the 3 essential tasks today.', 'Tu lista está cargada. Prioriza solo las 3 tareas esenciales de hoy.'],
  'Seu próximo melhor passo é avançar nas tarefas de maior impacto.': ['Your next best step is to work on the highest-impact tasks.', 'Tu siguiente mejor paso es avanzar en las tareas de mayor impacto.'],
  '⭐ Ainda não há XP histórico suficiente.': ['⭐ There is not enough historical XP yet.', '⭐ Todavía no hay suficiente XP histórico.'],
  'Sessão concluída 🎉': ['Session completed 🎉', 'Sesión completada 🎉'],
  '🔥 Hábitos pendentes hoje': ['🔥 Habits pending today', '🔥 Hábitos pendientes hoy'],
  'Hábito': ['Habit', 'Hábito'], 'Hábito selecionado': ['Selected habit', 'Hábito seleccionado'], '🔥 Focando neste hábito': ['🔥 Focusing on this habit', '🔥 Enfocándome en este hábito'],
  'Início / Fim': ['Start / End', 'Inicio / Fin'], 'Decisão?': ['Decision?', '¿Decisión?'], 'Início': ['Start', 'Inicio'], 'início/fim': ['start/end', 'inicio/fin'], 'decisão': ['decision', 'decisión'],
  'Sem título': ['Untitled', 'Sin título'], 'Crie um processo para começar': ['Create a process to get started', 'Crea un proceso para comenzar'], 'Área de desenho dos processos': ['Process drawing area', 'Área de dibujo de procesos'], 'Selecionar conexão': ['Select connection', 'Seleccionar conexión'],
  'Forte associação positiva': ['Strong positive association', 'Asociación positiva fuerte'], 'Forte associação negativa': ['Strong negative association', 'Asociación negativa fuerte'],
  'Associação moderada positiva': ['Moderate positive association', 'Asociación positiva moderada'], 'Associação moderada negativa': ['Moderate negative association', 'Asociación negativa moderada'],
  'Associação fraca positiva': ['Weak positive association', 'Asociación positiva débil'], 'Associação fraca negativa': ['Weak negative association', 'Asociación negativa débil'], 'Associação muito fraca': ['Very weak association', 'Asociación muy débil'],
  'Foco é um fator importante': ['Focus is an important factor', 'El enfoque es un factor importante'], 'Hábitos parecem ajudar': ['Habits seem to help', 'Los hábitos parecen ayudar'], 'Foco merece investigação': ['Focus deserves investigation', 'El enfoque merece investigación'],
  'Ainda procurando padrões': ['Still looking for patterns', 'Aún buscando patrones'], 'Seus dados ainda não mostram associações suficientemente fortes. Continue registrando diariamente.': ['Your data does not show strong enough associations yet. Keep logging daily.', 'Tus datos aún no muestran asociaciones suficientemente fuertes. Sigue registrando a diario.'],
  'Diário': ['Diary', 'Diario'], 'diária': ['daily', 'diaria'], 'Diária': ['Daily', 'Diaria'], 'hábitos': ['habits', 'hábitos'], 'Tarefa sem título': ['Untitled task', 'Tarea sin título'], 'Transação': ['Transaction', 'Transacción'],
  'Seu navegador não oferece notificações.': ['Your browser does not support notifications.', 'Tu navegador no admite notificaciones.'], 'As notificações não foram autorizadas.': ['Notifications were not authorized.', 'Las notificaciones no fueron autorizadas.'],
  'Informe um valor válido.': ['Enter a valid value.', 'Introduce un valor válido.'], '⚠️ Esse horário entra em conflito com outro compromisso.': ['⚠️ This time conflicts with another commitment.', '⚠️ Este horario entra en conflicto con otro compromiso.'],
  'Média': ['Medium', 'Media'], 'Hábitos são gerenciados na página Hábitos.': ['Habits are managed on the Habits page.', 'Los hábitos se gestionan en la página Hábitos.'], 'Transações são gerenciadas no Financeiro.': ['Transactions are managed in Finance.', 'Las transacciones se gestionan en Finanzas.'],
  '🗑️ Evento excluído.': ['🗑️ Event deleted.', '🗑️ Evento eliminado.'], '🔥 Hábito concluído!': ['🔥 Habit completed!', '🔥 ¡Hábito completado!'], 'Hábito desmarcado.': ['Habit unchecked.', 'Hábito desmarcado.'], 'Sáb': ['Sat', 'Sáb'],
  'Ex.: Aula de programação': ['E.g. Programming class', 'Ej.: Clase de programación'], 'Ex.: Salário': ['E.g. Salary', 'Ej.: Salario'], 'Ex.: Aporte em ações': ['E.g. Stock contribution', 'Ej.: Aporte en acciones'],
  'Detalhes, local, materiais ou observações...': ['Details, location, materials or notes...', 'Detalles, lugar, materiales u observaciones...'], 'Ex.: Alimentação': ['E.g. Food', 'Ej.: Alimentación'], 'Ex.: Ações': ['E.g. Stocks', 'Ej.: Acciones'],
  '💾 Salvar alterações': ['💾 Save changes', '💾 Guardar cambios'], 'Tarefa diária': ['Daily task', 'Tarea diaria'], 'crédito': ['credit', 'crédito'],
  'Seu dia está livre. Aproveite para planejar o próximo passo.': ['Your day is clear. Use it to plan the next step.', 'Tu día está libre. Aprovecha para planificar el siguiente paso.'],
  'Você tem bastante coisa pendente. Escolha as 1–3 tarefas mais importantes antes de começar.': ['You have quite a lot pending. Choose the 1–3 most important tasks before starting.', 'Tienes bastante pendiente. Elige las 1–3 tareas más importantes antes de empezar.'],
  'Sua energia e foco estão bons. Este pode ser um ótimo momento para uma tarefa difícil.': ['Your energy and focus are good. This may be a great time for a difficult task.', 'Tu energía y enfoque están bien. Puede ser un buen momento para una tarea difícil.'],
  'Seu desempenho está bom. Mantenha o ritmo sem exagerar na quantidade de tarefas.': ['Your performance is good. Keep the pace without overloading yourself with tasks.', 'Tu rendimiento es bueno. Mantén el ritmo sin excederte con las tareas.'],
  'Você está avançando muito bem hoje. Foque em terminar o que realmente importa.': ['You are making great progress today. Focus on finishing what really matters.', 'Hoy estás avanzando muy bien. Concéntrate en terminar lo que realmente importa.'],
  'Nenhuma movimentação financeira hoje': ['No financial activity today', 'Ningún movimiento financiero hoy'], 'Sem conteúdo.': ['No content.', 'Sin contenido.'], 'Escreva o que precisa ficar visível...': ['Write what needs to stay visible...', 'Escribe lo que debe quedar visible...'],
  'Prévia do post-it': ['Sticky note preview', 'Vista previa de la nota'], 'Assim seu aviso ficará no mural.': ['This is how your note will appear on the board.', 'Así aparecerá tu aviso en el mural.'], 'Transforme uma intenção em meta.': ['Turn an intention into a goal.', 'Convierte una intención en una meta.'],
  'Mantenha a sequência': ['Keep the streak', 'Mantén la racha'], 'Cadastre seus hábitos principais': ['Add your main habits', 'Registra tus hábitos principales'], 'Desmarcar hábito': ['Uncheck habit', 'Desmarcar hábito'], 'Concluir hábito': ['Complete habit', 'Completar hábito'], 'Hábito sem nome': ['Unnamed habit', 'Hábito sin nombre'], 'Concluído': ['Completed', 'Completado'],
  'Seu planejamento de estudos aparecerá aqui.': ['Your study plan will appear here.', 'Tu planificación de estudios aparecerá aquí.'], 'Próximo nível': ['Next level', 'Siguiente nivel'], 'Não informado': ['Not provided', 'No informado'],
  'Não foi possível salvar a configuração da Sidebar.': ['Could not save sidebar settings.', 'No se pudo guardar la configuración de la barra lateral.'], 'Abrir menu de navegação': ['Open navigation menu', 'Abrir menú de navegación'], 'Fechar menu de navegação': ['Close navigation menu', 'Cerrar menú de navegación'], 'Navegação principal': ['Main navigation', 'Navegación principal'],
  'Buscar página...': ['Search page...', 'Buscar página...'], 'Buscar página no menu': ['Search page in menu', 'Buscar página en el menú'], 'Fechar personalização': ['Close customization', 'Cerrar personalización'], 'A pesquisa está escondida': ['Search is hidden', 'La búsqueda está oculta'], 'Ocultar pesquisa de páginas': ['Hide page search', 'Ocultar búsqueda de páginas'], 'Mostrar pesquisa de páginas': ['Show page search', 'Mostrar búsqueda de páginas'], 'Página fixa': ['Pinned page', 'Página fijada'], 'Visível no menu': ['Visible in menu', 'Visible en el menú'], 'Referências: permitir ou bloquear aparições em outras páginas': ['References: allow or block appearances on other pages', 'Referencias: permitir o bloquear apariciones en otras páginas'],
  '✓ Etapas concluídas': ['✓ Steps completed', '✓ Pasos completados'], '➡️ Avançar etapa': ['➡️ Advance step', '➡️ Avanzar etapa'], 'Qual resultado você quer alcançar?': ['What result do you want to achieve?', '¿Qué resultado quieres alcanzar?'], 'Salvar alterações': ['Save changes', 'Guardar cambios'],
  '🎬 1 episódio': ['🎬 1 episode', '🎬 1 episodio'], '📚 Visão geral': ['📚 Overview', '📚 Resumen'], '⏱️ Sessões': ['⏱️ Sessions', '⏱️ Sesiones'], '🧠 Revisão espaçada': ['🧠 Spaced repetition', '🧠 Repetición espaciada'], '😵 Não lembro': ['😵 I don’t remember', '😵 No recuerdo'], 'Exercícios': ['Exercises', 'Ejercicios'],
  'Não foi possível carregar seus estudos.': ['Could not load your studies.', 'No se pudieron cargar tus estudios.'], 'Sem conteúdo': ['No content', 'Sin contenido'], 'Sessão de estudo registrada.': ['Study session recorded.', 'Sesión de estudio registrada.'], 'Conteúdo colocado na revisão espaçada.': ['Content added to spaced repetition.', 'Contenido añadido a la repetición espaciada.'], 'Nenhuma revisão atrasada ou para hoje.': ['No overdue or today reviews.', 'No hay revisiones atrasadas ni para hoy.'], 'Ex.: Matemática': ['E.g. Mathematics', 'Ej.: Matemáticas'], 'Ex.: Matemática Discreta': ['E.g. Discrete Mathematics', 'Ej.: Matemáticas Discretas'], 'java, lógica, prova': ['java, logic, proof', 'java, lógica, demostración'],
  'Finanças': ['Finance', 'Finanzas'], 'Saúde': ['Health', 'Salud'], 'Médio prazo': ['Medium term', 'Mediano plazo'], 'Até 3 meses': ['Up to 3 months', 'Hasta 3 meses'], 'próximo passo': ['next step', 'siguiente paso'], 'Opções': ['Options', 'Opciones'], '🏆 Concluído': ['🏆 Completed', '🏆 Completado'], 'Reabrir próximo passo': ['Reopen next step', 'Reabrir siguiente paso'], 'Concluir próximo passo': ['Complete next step', 'Completar siguiente paso'],
  'Ex.: Conseguir estágio em Computação': ['E.g. Get a computing internship', 'Ej.: Conseguir una pasantía en informática'], 'O que exatamente você quer alcançar?': ['What exactly do you want to achieve?', '¿Qué quieres conseguir exactamente?'], 'Por que esse objetivo é importante para você?': ['Why is this goal important to you?', '¿Por qué es importante este objetivo para ti?'], 'Ex.: Resolver 20 questões de Matemática': ['E.g. Solve 20 Mathematics problems', 'Ej.: Resolver 20 ejercicios de Matemáticas'], 'Ex.: Finalizar portfólio': ['E.g. Finish portfolio', 'Ej.: Terminar el portafolio'],
  'Nova área': ['New area', 'Nueva área'], 'Gráfico de evolução': ['Progress chart', 'Gráfico de evolución'], 'Acompanhe sua evolução nesta área.': ['Track your progress in this area.', 'Sigue tu evolución en esta área.'], 'Acompanhe seu desempenho e evolução.': ['Track your performance and progress.', 'Sigue tu rendimiento y evolución.'], 'Acompanhe sua evolução ao longo do tempo.': ['Track your progress over time.', 'Sigue tu evolución a lo largo del tiempo.'], 'valor numérico': ['numeric value', 'valor numérico'], 'Sem observação': ['No observation', 'Sin observación'], 'Editar área': ['Edit area', 'Editar área'], 'Ex.: Acompanhar meu progresso na musculação.': ['E.g. Track my strength training progress.', 'Ej.: Seguir mi progreso en el entrenamiento de fuerza.'],
  'Filtrar tags por tipo de aplicação': ['Filter tags by application type', 'Filtrar etiquetas por tipo de aplicación'], 'Sessões de estudo': ['Study sessions', 'Sesiones de estudio'], 'Reflexões': ['Reflections', 'Reflexiones'], 'Matérias de estudos': ['Study subjects', 'Materias de estudio'], 'Áreas': ['Areas', 'Áreas'],
  'Erro ao carregar conexões.': ['Error loading connections.', 'Error al cargar conexiones.'], 'Erro ao pesquisar usuários.': ['Error searching users.', 'Error al buscar usuarios.'], 'Conexão aceita.': ['Connection accepted.', 'Conexión aceptada.'], 'Usuário bloqueado.': ['User blocked.', 'Usuario bloqueado.'], 'Erro ao atualizar conexão.': ['Error updating connection.', 'Error al actualizar la conexión.'], 'Digite o nome ou @usuário...': ['Enter name or @username...', 'Escribe el nombre o @usuario...'], 'Sem @usuário': ['No @username', 'Sin @usuario'],
  'Você está com muitas tarefas pendentes. Escolha uma prioridade antes de começar outra.': ['You have many pending tasks. Choose a priority before starting another.', 'Tienes muchas tareas pendientes. Elige una prioridad antes de empezar otra.'], 'Seu foco e sua energia estão altos. Aproveite para trabalhar na tarefa mais importante.': ['Your focus and energy are high. Use them on the most important task.', 'Tu enfoque y energía están altos. Aprovecha para trabajar en la tarea más importante.'], 'Seu sono merece atenção': ['Your sleep deserves attention', 'Tu sueño merece atención'], 'Próximo passo': ['Next step', 'Siguiente paso'],
  'Pesquisar': ['Search', 'Buscar'], 'Buscar tarefa ou descrição...': ['Search task or description...', 'Buscar tarea o descripción...'], 'Buscar tarefas': ['Search tasks', 'Buscar tareas'], 'Status': ['Status', 'Estado'], 'Reativar tarefa': ['Reactivate task', 'Reactivar tarea'], 'Cancelar sem excluir': ['Cancel without deleting', 'Cancelar sin eliminar'], 'Reativar': ['Reactivate', 'Reactivar'], 'Cancelar': ['Cancel', 'Cancelar'], 'Editar': ['Edit', 'Editar'], 'Excluir': ['Delete', 'Eliminar'], 'Adicionar': ['Add', 'Añadir'], 'Nova tarefa': ['New task', 'Nueva tarea'], 'Editar tarefa': ['Edit task', 'Editar tarea'], 'Nome da tarefa *': ['Task name *', 'Nombre de la tarea *'], 'Descrição': ['Description', 'Descripción'], 'Prioridade': ['Priority', 'Prioridad'], 'Nenhum': ['None', 'Ninguno'], 'Criar tarefa': ['Create task', 'Crear tarea'], 'Criar área': ['Create area', 'Crear área'], 'Nome da área *': ['Area name *', 'Nombre del área *'], 'Nome da área': ['Area name', 'Nombre del área'],
  'Excluir esta observação?': ['Delete this note?', '¿Eliminar esta observación?'], 'Excluir esta tarefa?': ['Delete this task?', '¿Eliminar esta tarea?'], 'Excluir todas as tarefas concluídas?': ['Delete all completed tasks?', '¿Eliminar todas las tareas completadas?'], 'Excluir o grupo': ['Delete group', 'Eliminar grupo'],
  'Fechar': ['Close', 'Cerrar'], 'Criar atividade': ['Create activity', 'Crear actividad'], 'Conexões': ['Connections', 'Conexiones'], 'Data limite': ['Due date', 'Fecha límite'], 'Carregando...': ['Loading...', 'Cargando...'], 'Nenhum registro ainda.': ['No records yet.', 'Aún no hay registros.'],
  'Somente o proprietário pode excluir este grupo.': ['Only the owner can delete this group.', 'Solo el propietario puede eliminar este grupo.'], 'Grupo excluído com sucesso.': ['Group deleted successfully.', 'Grupo eliminado correctamente.'], 'Não foi possível excluir o grupo.': ['Could not delete the group.', 'No se pudo eliminar el grupo.'], 'Sem descrição': ['No description', 'Sin descripción'], '🌐 Conexões': ['🌐 Connections', '🌐 Conexiones'], 'Voltar': ['Back', 'Volver'], 'Atividade': ['Activity', 'Actividad'],
  'Não registrado': ['Not recorded', 'No registrado'], 'Não registrada': ['Not recorded', 'No registrada'], 'Sono': ['Sleep', 'Sueño'], 'Energia': ['Energy', 'Energía'], 'Foco': ['Focus', 'Enfoque'], 'Humor': ['Mood', 'Ánimo'], 'horas': ['hours', 'horas'],
  'Seu sono está abaixo de 6 horas; isso pode prejudicar sua energia e foco.': ['Your sleep is below 6 hours; this may affect your energy and focus.', 'Tu sueño está por debajo de 6 horas; esto puede afectar tu energía y enfoque.'], 'Seu tempo de sono está em uma faixa favorável para acompanhar sua produtividade.': ['Your sleep duration is in a favorable range for tracking productivity.', 'Tu duración del sueño está en un rango favorable para seguir la productividad.'], 'Sua energia está baixa. Considere reduzir a quantidade de tarefas.': ['Your energy is low. Consider reducing the number of tasks.', 'Tu energía está baja. Considera reducir la cantidad de tareas.'], 'Sua energia está alta. Pode ser um bom momento para tarefas importantes.': ['Your energy is high. It may be a good time for important tasks.', 'Tu energía está alta. Puede ser un buen momento para tareas importantes.'], 'Seu foco está baixo. Tente trabalhar com blocos menores e menos distrações.': ['Your focus is low. Try working in smaller blocks with fewer distractions.', 'Tu enfoque está bajo. Intenta trabajar en bloques más pequeños y con menos distracciones.'], 'Seu foco está bom. Aproveite para realizar uma tarefa de maior dificuldade.': ['Your focus is good. Use it to tackle a more difficult task.', 'Tu enfoque está bien. Aprovecha para realizar una tarea más difícil.'], 'Sua produtividade registrada hoje está alta.': ['Your recorded productivity today is high.', 'Tu productividad registrada hoy es alta.'], 'Sua produtividade registrada está baixa; priorize poucas tarefas importantes.': ['Your recorded productivity is low; prioritize a few important tasks.', 'Tu productividad registrada es baja; prioriza algunas tareas importantes.'],
  'Ações': ['Stocks', 'Acciones'], 'Não foi possível carregar seus investimentos.': ['Could not load your investments.', 'No se pudieron cargar tus inversiones.'], 'Erro ao consultar cotação:': ['Error fetching quote:', 'Error al consultar la cotización:'], 'Informe uma quantidade válida.': ['Enter a valid quantity.', 'Introduce una cantidad válida.'], 'Informe um preço de compra válido.': ['Enter a valid purchase price.', 'Introduce un precio de compra válido.'], 'Sua carteira está vazia.': ['Your portfolio is empty.', 'Tu cartera está vacía.'], 'Investimento removido, mas o histórico não pôde ser atualizado.': ['Investment removed, but history could not be updated.', 'Inversión eliminada, pero no se pudo actualizar el historial.'], 'Gráfico de evolução patrimonial': ['Portfolio value chart', 'Gráfico de evolución patrimonial'], 'Gráfico de rosca da distribuição por classe': ['Asset-class distribution donut chart', 'Gráfico de distribución por clase'], 'Preço médio (R$)': ['Average price (BRL)', 'Precio medio (BRL)'], '🔄 Consultando cotação...': ['🔄 Fetching quote...', '🔄 Consultando cotización...'], 'Adicionar à carteira': ['Add to portfolio', 'Añadir a la cartera'], 'Atualizar cotação': ['Refresh quote', 'Actualizar cotización'],
  'Alimentação': ['Food', 'Alimentación'], 'Educação': ['Education', 'Educación'], 'Salário': ['Salary', 'Salario'], 'Negócio': ['Business', 'Negocio'], 'Benefícios': ['Benefits', 'Beneficios'], 'Débito': ['Debit', 'Débito'], 'Crédito': ['Credit', 'Crédito'], 'Transferência': ['Transfer', 'Transferencia'], 'Informe uma descrição.': ['Enter a description.', 'Introduce una descripción.'], 'Transação atualizada.': ['Transaction updated.', 'Transacción actualizada.'], 'Transação adicionada.': ['Transaction added.', 'Transacción añadida.'], 'Transação removida.': ['Transaction removed.', 'Transacción eliminada.'], 'Defina um orçamento mensal abaixo.': ['Set a monthly budget below.', 'Define un presupuesto mensual abajo.'], '✏️ Editar transação': ['✏️ Edit transaction', '✏️ Editar transacción'], '➕ Registrar transação': ['➕ Record transaction', '➕ Registrar transacción'], '💾 Salvar alteração': ['💾 Save change', '💾 Guardar cambio'], 'Déficit': ['Deficit', 'Déficit'],
  'Histórico': ['History', 'Historial'], 'Desatenção': ['Inattention', 'Desatención'], 'Interpretação': ['Interpretation', 'Interpretación'], 'Cálculo': ['Calculation', 'Cálculo'], 'Não conhecia o conteúdo': ['I did not know the content', 'No conocía el contenido'], 'Revisão': ['Review', 'Revisión'], 'Diário salvo com sucesso.': ['Diary saved successfully.', 'Diario guardado correctamente.'], 'Preencha disciplina, conteúdo e tempo de estudo.': ['Fill in subject, content and study time.', 'Completa materia, contenido y tiempo de estudio.'], 'Sessão registrada! +40 XP': ['Session recorded! +40 XP', '¡Sesión registrada! +40 XP'], 'Preencha título, disciplina e explicação.': ['Fill in title, subject and explanation.', 'Completa título, materia y explicación.'], 'Preencha a questão, resposta correta e motivo do erro.': ['Fill in the question, correct answer and reason for the mistake.', 'Completa la pregunta, respuesta correcta y motivo del error.'], 'Reflexão semanal salva.': ['Weekly reflection saved.', 'Reflexión semanal guardada.'],
  '🎯 Minha intenção para hoje': ['🎯 My intention for today', '🎯 Mi intención para hoy'], 'Como você quer viver este dia?': ['How do you want to live this day?', '¿Cómo quieres vivir este día?'], 'Até 3 coisas que realmente importam hoje...': ['Up to 3 things that really matter today...', 'Hasta 3 cosas que realmente importan hoy...'], 'Uma ou mais coisas pelas quais você é grato.': ['One or more things you are grateful for.', 'Una o más cosas por las que estás agradecido.'], 'Motivação': ['Motivation', 'Motivación'], 'Acontecimentos importantes, pessoas, situações...': ['Important events, people, situations...', 'Acontecimientos importantes, personas, situaciones...'], 'Qual foi sua principal realização?': ['What was your main accomplishment?', '¿Cuál fue tu principal logro?'], 'O que você faria diferente?': ['What would you do differently?', '¿Qué harías diferente?'], '🚀 O que quero melhorar amanhã?': ['🚀 What I want to improve tomorrow', '🚀 Lo que quiero mejorar mañana'], 'Anotações': ['Notes', 'Notas'], 'Atualizar diário': ['Update diary', 'Actualizar diario'], 'Salvar diário': ['Save diary', 'Guardar diario'], 'Registrar sessão': ['Record session', 'Registrar sesión'], 'Transforme cada sessão em dados úteis para melhorar seu aprendizado.': ['Turn each session into useful data to improve your learning.', 'Convierte cada sesión en datos útiles para mejorar tu aprendizaje.'], 'Conteúdo': ['Content', 'Contenido'], 'Ex.: Relações de equivalência': ['E.g. Equivalence relations', 'Ej.: Relaciones de equivalencia'], 'Número de questões': ['Number of questions', 'Número de preguntas'], 'Observações': ['Notes', 'Observaciones'], 'Como foi a sessão?': ['How was the session?', '¿Cómo fue la sesión?'], 'Explique o que você aprendeu com suas próprias palavras.': ['Explain what you learned in your own words.', 'Explica lo que aprendiste con tus propias palabras.'], 'O que ainda não domino?': ['What do I still not master?', '¿Qué todavía no domino?'], 'Nenhuma sessão registrada': ['No session recorded', 'Ninguna sesión registrada'], 'Registre sua primeira sessão de estudo acima.': ['Record your first study session above.', 'Registra arriba tu primera sesión de estudio.'], 'REVISÃO ESPAÇADA': ['SPACED REPETITION', 'REPETICIÓN ESPACIADA'], 'Central de revisões': ['Review center', 'Centro de revisiones'], 'Revise no momento certo para transformar conhecimento em memória.': ['Review at the right time to turn knowledge into memory.', 'Repasa en el momento adecuado para convertir conocimiento en memoria.'], 'Adicione conhecimentos na seção Conhecimentos.': ['Add knowledge in the Knowledge section.', 'Añade conocimientos en la sección Conocimientos.'], '🔴 Revisões atrasadas': ['🔴 Overdue reviews', '🔴 Revisiones atrasadas'], '🟡 Revisões de hoje': ['🟡 Today’s reviews', '🟡 Revisiones de hoy'], '🔵 Próximas revisões': ['🔵 Upcoming reviews', '🔵 Próximas revisiones'], 'Registre por que errou para evitar repetir o mesmo padrão.': ['Record why you made the mistake to avoid repeating the same pattern.', 'Registra por qué te equivocaste para evitar repetir el mismo patrón.'], 'Questão': ['Question', 'Pregunta'], 'Cole ou descreva a questão...': ['Paste or describe the question...', 'Pega o describe la pregunta...'], 'O que você respondeu?': ['What did you answer?', '¿Qué respondiste?'], 'Não registrada.': ['Not recorded.', 'No registrada.'], 'Explique com suas próprias palavras. É assim que o conhecimento realmente fica.': ['Explain it in your own words. That is how knowledge really sticks.', 'Explícalo con tus propias palabras. Así es como el conocimiento realmente permanece.'], 'Título': ['Title', 'Título'], 'Ex.: Teorema de Pitágoras': ['E.g. Pythagorean theorem', 'Ej.: Teorema de Pitágoras'], 'Imagine que está ensinando para alguém...': ['Imagine you are teaching someone...', 'Imagina que estás enseñando a alguien...'], 'Crie um exemplo prático.': ['Create a practical example.', 'Crea un ejemplo práctico.'], 'Dúvida': ['Question / doubt', 'Duda'], 'O que ainda não está completamente claro?': ['What is still not completely clear?', '¿Qué todavía no está completamente claro?'], 'Sua base está vazia': ['Your knowledge base is empty', 'Tu base está vacía'], 'Comece registrando aquilo que você acabou de aprender.': ['Start by recording what you just learned.', 'Empieza registrando lo que acabas de aprender.'], 'Seu aprendizado em números': ['Your learning in numbers', 'Tu aprendizaje en números'], 'Veja o que está funcionando e onde você precisa melhorar.': ['See what is working and where you need to improve.', 'Mira qué funciona y dónde necesitas mejorar.'], 'Registre algumas sessões de estudo para gerar análises.': ['Record some study sessions to generate analysis.', 'Registra algunas sesiones de estudio para generar análisis.'], 'Quando você registrar erros, eles aparecerão aqui.': ['When you record mistakes, they will appear here.', 'Cuando registres errores, aparecerán aquí.'], 'Diário escrito': ['Written diary', 'Diario escrito'], 'HISTÓRICO': ['HISTORY', 'HISTORIAL'], 'Consulte somente seus registros pessoais do Diário.': ['View only your personal diary records.', 'Consulta solo tus registros personales del Diario.'], 'Seu histórico está vazio': ['Your history is empty', 'Tu historial está vacío'], 'O que seu diário revela': ['What your diary reveals', 'Lo que revela tu diario'], 'Padrões calculados a partir dos seus próprios registros.': ['Patterns calculated from your own records.', 'Patrones calculados a partir de tus propios registros.'], 'Você registrou um dia importante.': ['You recorded an important day.', 'Registraste un día importante.'], 'REFLEXÃO': ['REFLECTION', 'REFLEXIÓN'], 'Reflexão semanal': ['Weekly reflection', 'Reflexión semanal'], 'Pare, analise a semana e decida conscientemente o que fazer na próxima.': ['Pause, analyze the week and consciously decide what to do next.', 'Párate, analiza la semana y decide conscientemente qué hacer después.'], 'Onde você sente que desperdiçou tempo?': ['Where do you feel you wasted time?', '¿Dónde sientes que perdiste tiempo?'], 'O que não está ajudando?': ['What is not helping?', '¿Qué no está ayudando?'], '🎯 Qual será minha prioridade na próxima semana?': ['🎯 What will be my priority next week?', '🎯 ¿Cuál será mi prioridad la próxima semana?'],
};

const STORAGE_KEY = 'meu-assistente-language';
const LanguageContext = createContext(null);

function getInitialLanguage(user) {
  try {
    const userKey = user?.id || user?.email;
    if (userKey) {
      const scoped = localStorage.getItem(`${STORAGE_KEY}:${String(userKey).toLowerCase()}`);
      if (LANGUAGES.some((item) => item.code === scoped)) return scoped;
    }
    const saved = localStorage.getItem(STORAGE_KEY);
    if (LANGUAGES.some((item) => item.code === saved)) return saved;
  } catch {}
  return 'pt-BR';
}

function normalizeText(value) {
  return String(value ?? '').replace(/\s+/g, ' ').trim();
}

function translateText(value, language) {
  const original = String(value ?? '');
  if (language === 'pt-BR' || !original.trim()) return original;

  const normalized = normalizeText(original);
  const exact = UI_TRANSLATIONS[normalized];
  if (exact) return original.replace(normalized, exact[language === 'en-US' ? 0 : 1]);

  // Common dynamic messages that contain user data/numbers.
  const rules = language === 'en-US'
    ? [
        [/^Excluir "(.+)"\?$/i, 'Delete "$1"?'],
        [/^Excluir a área "(.+)"\?$/i, 'Delete area "$1"?'],
        [/^Excluir a tarefa "(.+)"\?$/i, 'Delete task "$1"?'],
        [/^(\d+) XP para o próximo nível$/i, '$1 XP to next level'],
        [/^(\d+) de (\d+) concluídos$/i, '$1 of $2 completed'],
        [/^Nenhum (.+) cadastrado$/i, 'No $1 added'],
      ]
    : [
        [/^Excluir "(.+)"\?$/i, '¿Eliminar "$1"?'],
        [/^Excluir a área "(.+)"\?$/i, '¿Eliminar el área "$1"?'],
        [/^Excluir a tarefa "(.+)"\?$/i, '¿Eliminar la tarea "$1"?'],
        [/^(\d+) XP para o próximo nível$/i, '$1 XP para el siguiente nivel'],
        [/^(\d+) de (\d+) concluídos$/i, '$1 de $2 completados'],
        [/^Nenhum (.+) cadastrado$/i, 'Ningún $1 registrado'],
      ];
  for (const [pattern, replacement] of rules) {
    if (pattern.test(normalized)) return original.replace(normalized, normalized.replace(pattern, replacement));
  }

  // Translate small static labels that are often composed with punctuation.
  const wordMaps = language === 'en-US'
    ? { 'Salvar': 'Save', 'Salvando': 'Saving', 'Cancelar': 'Cancel', 'Editar': 'Edit', 'Excluir': 'Delete', 'Adicionar': 'Add', 'Criar': 'Create', 'Fechar': 'Close', 'Voltar': 'Back', 'Nome': 'Name', 'Data': 'Date', 'Hora': 'Time', 'Descrição': 'Description', 'Observações': 'Notes', 'Opções': 'Options', 'Pesquisar': 'Search', 'Carregando': 'Loading', 'Hoje': 'Today', 'Amanhã': 'Tomorrow', 'Semana': 'Week', 'Mês': 'Month', 'Dia': 'Day', 'Concluído': 'Completed', 'Pendente': 'Pending', 'Ativo': 'Active', 'Inativo': 'Inactive', 'Sim': 'Yes', 'Não': 'No', 'Nenhum': 'None', 'Próximo': 'Next', 'Anterior': 'Previous', 'Resultado': 'Result', 'Área': 'Area', 'Projeto': 'Project', 'Grupo': 'Group', 'Meta': 'Goal', 'Tarefa': 'Task', 'Hábitos': 'Habits', 'Estudos': 'Studies', 'Investimentos': 'Investments', 'Finanças': 'Finance', 'Calendário': 'Calendar', 'Agenda': 'Agenda', 'Relatórios': 'Reports', 'Coleções': 'Collections', 'Conquistas': 'Achievements', 'Evolução': 'Progress', 'Gamificação': 'Gamification', 'Conexões': 'Connections', 'Assistente': 'Assistant', 'Perfil': 'Profile', 'Idioma': 'Language', 'Prioridade': 'Priority', 'Status': 'Status', 'Média': 'Medium', 'Alta': 'High', 'Baixa': 'Low' }
    : { 'Salvar': 'Guardar', 'Salvando': 'Guardando', 'Cancelar': 'Cancelar', 'Editar': 'Editar', 'Excluir': 'Eliminar', 'Adicionar': 'Añadir', 'Criar': 'Crear', 'Fechar': 'Cerrar', 'Voltar': 'Volver', 'Nome': 'Nombre', 'Data': 'Fecha', 'Hora': 'Hora', 'Descrição': 'Descripción', 'Observações': 'Observaciones', 'Opções': 'Opciones', 'Pesquisar': 'Buscar', 'Carregando': 'Cargando', 'Hoje': 'Hoy', 'Amanhã': 'Mañana', 'Semana': 'Semana', 'Mês': 'Mes', 'Dia': 'Día', 'Concluído': 'Completado', 'Pendente': 'Pendiente', 'Ativo': 'Activo', 'Inativo': 'Inactivo', 'Sim': 'Sí', 'Não': 'No', 'Nenhum': 'Ninguno', 'Próximo': 'Siguiente', 'Anterior': 'Anterior', 'Resultado': 'Resultado', 'Área': 'Área', 'Projeto': 'Proyecto', 'Grupo': 'Grupo', 'Meta': 'Meta', 'Tarefa': 'Tarea', 'Hábitos': 'Hábitos', 'Estudos': 'Estudios', 'Investimentos': 'Inversiones', 'Finanças': 'Finanzas', 'Calendário': 'Calendario', 'Agenda': 'Agenda', 'Relatórios': 'Informes', 'Coleções': 'Colecciones', 'Conquistas': 'Logros', 'Evolução': 'Evolución', 'Gamificação': 'Gamificación', 'Conexões': 'Conexiones', 'Assistente': 'Asistente', 'Perfil': 'Perfil', 'Idioma': 'Idioma', 'Prioridade': 'Prioridad', 'Status': 'Estado', 'Média': 'Media', 'Alta': 'Alta', 'Baixa': 'Baja' };

  let translated = original;
  for (const [from, to] of Object.entries(wordMaps)) {
    translated = translated.replace(new RegExp(`(^|[^A-Za-zÀ-ÿ])${from.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?=$|[^A-Za-zÀ-ÿ])`, 'g'), `$1${to}`);
  }
  return translated;
}

function translateDom(root, language, originals) {
  if (!root) return;
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const textNodes = [];
  while (walker.nextNode()) textNodes.push(walker.currentNode);

  textNodes.forEach((node) => {
    const parent = node.parentElement;
    if (!parent || ['SCRIPT', 'STYLE', 'NOSCRIPT', 'TEXTAREA'].includes(parent.tagName)) return;
    if (parent.closest('[data-no-translate="true"]')) return;
    if (!originals.has(node)) originals.set(node, node.nodeValue);
    const source = originals.get(node);
    const translated = translateText(source, language);
    if (node.nodeValue !== translated) node.nodeValue = translated;
  });

  const attrs = ['placeholder', 'title', 'aria-label', 'aria-description'];
  root.querySelectorAll?.('*').forEach((element) => {
    if (element.dataset?.noTranslate === 'true') return;
    attrs.forEach((attr) => {
      if (!element.hasAttribute(attr)) return;
      const key = `${attr}:${element}`;
      if (!element.__languageOriginals) element.__languageOriginals = {};
      if (!(attr in element.__languageOriginals)) element.__languageOriginals[attr] = element.getAttribute(attr);
      const source = element.__languageOriginals[attr];
      const translated = translateText(source, language);
      if (element.getAttribute(attr) !== translated) element.setAttribute(attr, translated);
    });
  });
}

function LanguageDomRuntime({ language }) {
  const originals = useMemo(() => new WeakMap(), []);

  const apply = useCallback(() => {
    translateDom(document.getElementById('root'), language, originals);
  }, [language, originals]);

  useEffect(() => {
    apply();
    const root = document.getElementById('root');
    if (!root) return undefined;
    const observer = new MutationObserver(() => {
      // Defer one tick so React can finish its DOM update before translating.
      queueMicrotask(apply);
    });
    observer.observe(root, { childList: true, subtree: true, characterData: true });
    return () => observer.disconnect();
  }, [apply]);

  return null;
}

export function LanguageProvider({ currentUser, children }) {
  const [language, setLanguageState] = useState(() => getInitialLanguage(currentUser));

  useEffect(() => {
    setLanguageState(getInitialLanguage(currentUser));
  }, [currentUser?.id, currentUser?.email]);

  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dataset.language = language;

    // Native browser dialogs are outside React's DOM. Translate them too so
    // confirmations and validation prompts follow the selected language.
    const originalAlert = window.alert;
    const originalConfirm = window.confirm;
    const originalPrompt = window.prompt;
    window.alert = (message) => originalAlert.call(window, translateText(message, language));
    window.confirm = (message) => originalConfirm.call(window, translateText(message, language));
    window.prompt = (message, defaultValue) => originalPrompt.call(window, translateText(message, language), defaultValue);

    return () => {
      window.alert = originalAlert;
      window.confirm = originalConfirm;
      window.prompt = originalPrompt;
    };
  }, [language]);

  const setLanguage = (nextLanguage) => {
    const safeLanguage = LANGUAGES.some((item) => item.code === nextLanguage) ? nextLanguage : 'pt-BR';
    setLanguageState(safeLanguage);
    try {
      localStorage.setItem(STORAGE_KEY, safeLanguage);
      const userKey = currentUser?.id || currentUser?.email;
      if (userKey) localStorage.setItem(`${STORAGE_KEY}:${String(userKey).toLowerCase()}`, safeLanguage);
    } catch {}
  };

  const value = useMemo(() => ({
    language,
    setLanguage,
    languages: LANGUAGES,
    t: (key) => DICTIONARY[language]?.[key] ?? DICTIONARY['pt-BR'][key] ?? key,
    translateText: (text) => translateText(text, language),
  }), [language, currentUser?.id, currentUser?.email]);

  return (
    <LanguageContext.Provider value={value}>
      {children}
      <LanguageDomRuntime language={language} />
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) throw new Error('useLanguage must be used inside LanguageProvider');
  return context;
}
