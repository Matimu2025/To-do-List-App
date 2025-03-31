/**
 * Calendar module for the To-Do List application
 * Handles displaying and interacting with the calendar
 */

const Calendar = (function() {
    // DOM elements
    const calendarModal = document.getElementById('calendar-modal');
    const calendarDays = document.getElementById('calendar-days');
    const monthYearElement = document.getElementById('month-year');
    const prevMonthBtn = document.getElementById('prev-month');
    const nextMonthBtn = document.getElementById('next-month');
    const selectedDateElement = document.getElementById('selected-date');
    const tasksOnDateElement = document.getElementById('tasks-on-date');
    
    // Current date
    let currentDate = new Date();
    let selectedDate = new Date();
    
    // Month names
    const months = [
        'January', 'February', 'March', 'April', 'May', 'June', 
        'July', 'August', 'September', 'October', 'November', 'December'
    ];
    
    /**
     * Format date as YYYY-MM-DD
     * @param {Date} date - Date object
     * @returns {String} Formatted date string
     */
    function formatDate(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }
    
    /**
     * Format date in a readable format (Month Day, Year)
     * @param {Date} date - Date object
     * @returns {String} Formatted date string
     */
    function formatReadableDate(date) {
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        return date.toLocaleDateString('en-US', options);
    }
    
    /**
     * Generate calendar for the current month
     */
    async function generateCalendar() {
        calendarDays.innerHTML = '';
        
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        
        // Update month and year display
        monthYearElement.textContent = `${months[month]} ${year}`;
        
        // Get first day of the month
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        
        // Get day of week for first day (0 = Sunday, 6 = Saturday)
        const startingDayOfWeek = firstDay.getDay();
        
        // Get total days in month
        const totalDays = lastDay.getDate();
        
        // Get dates with tasks - now with await
        const datesWithTasks = await Storage.getDatesWithTasks();
        
        // Get last day of previous month
        const prevMonthLastDay = new Date(year, month, 0).getDate();
        
        // Add days from previous month
        for (let i = startingDayOfWeek - 1; i >= 0; i--) {
            const dayNumber = prevMonthLastDay - i;
            const dayElement = createDayElement(dayNumber, 'other-month');
            calendarDays.appendChild(dayElement);
        }
        
        // Add days for current month
        for (let i = 1; i <= totalDays; i++) {
            const date = new Date(year, month, i);
            const dateString = formatDate(date);
            const isToday = isSameDay(date, new Date());
            const isSelected = isSameDay(date, selectedDate);
            const hasTask = datesWithTasks.includes(dateString);
            
            let className = '';
            if (isToday) className += ' today';
            if (isSelected) className += ' selected';
            if (hasTask) className += ' has-tasks';
            
            const dayElement = createDayElement(i, className);
            dayElement.dataset.date = dateString;
            dayElement.addEventListener('click', () => selectDate(date));
            
            calendarDays.appendChild(dayElement);
        }
        
        // Add days from next month to fill remaining grid
        const remainingDays = 42 - (startingDayOfWeek + totalDays);
        for (let i = 1; i <= remainingDays; i++) {
            const dayElement = createDayElement(i, 'other-month');
            calendarDays.appendChild(dayElement);
        }
    }
    
    /**
     * Create a day element for the calendar
     * @param {Number} dayNumber - Day number
     * @param {String} className - Additional CSS classes
     * @returns {HTMLElement} Day element
     */
    function createDayElement(dayNumber, className = '') {
        const dayElement = document.createElement('div');
        dayElement.className = `day ${className}`;
        dayElement.textContent = dayNumber;
        return dayElement;
    }
    
    /**
     * Check if two dates are the same day
     * @param {Date} date1 - First date
     * @param {Date} date2 - Second date
     * @returns {Boolean} Whether dates are the same day
     */
    function isSameDay(date1, date2) {
        return (
            date1.getFullYear() === date2.getFullYear() &&
            date1.getMonth() === date2.getMonth() &&
            date1.getDate() === date2.getDate()
        );
    }
    
    /**
     * Select a date and show tasks for that date
     * @param {Date} date - Date to select
     */
    async function selectDate(date) {
        selectedDate = date;
        
        // Update selected date in UI
        selectedDateElement.textContent = `Tasks for ${formatReadableDate(date)}`;
        
        // Get tasks for selected date - now with await
        const dateString = formatDate(date);
        const tasks = await Storage.getTasksByDate(dateString);
        
        // Display tasks
        displayTasksForDate(tasks);
        
        // Update calendar UI to reflect the selected date
        await generateCalendar();
    }
    
    /**
     * Display tasks for a specific date
     * @param {Array} tasks - Array of task objects
     */
    function displayTasksForDate(tasks) {
        tasksOnDateElement.innerHTML = '';
        
        if (tasks.length === 0) {
            const noTasksElement = document.createElement('div');
            noTasksElement.className = 'no-tasks';
            noTasksElement.textContent = 'No tasks for this date.';
            tasksOnDateElement.appendChild(noTasksElement);
            return;
        }
        
        tasks.forEach(task => {
            const taskElement = document.createElement('div');
            taskElement.className = `date-task-item ${task.completed ? 'completed' : ''}`;
            
            const taskTitle = document.createElement('div');
            taskTitle.className = 'date-task-title';
            taskTitle.textContent = task.title;
            
            taskElement.appendChild(taskTitle);
            tasksOnDateElement.appendChild(taskElement);
        });
    }
    
    /**
     * Go to previous month
     */
    async function prevMonth() {
        currentDate.setMonth(currentDate.getMonth() - 1);
        await generateCalendar();
    }
    
    /**
     * Go to next month
     */
    async function nextMonth() {
        currentDate.setMonth(currentDate.getMonth() + 1);
        await generateCalendar();
    }
    
    /**
     * Show calendar modal
     */
    async function showCalendar() {
        calendarModal.style.display = 'flex';
        await generateCalendar();
        await selectDate(new Date());
    }
    
    /**
     * Hide calendar modal
     */
    function hideCalendar() {
        calendarModal.style.display = 'none';
    }
    
    /**
     * Initialize calendar module
     */
    function init() {
        // Set up event listeners
        prevMonthBtn.addEventListener('click', () => prevMonth());
        nextMonthBtn.addEventListener('click', () => nextMonth());
        
        // Close calendar when clicking outside of it
        calendarModal.addEventListener('click', (e) => {
            if (e.target === calendarModal) {
                hideCalendar();
            }
        });
        
        // Set calendar button click event
        const calendarBtn = document.querySelector('.calendar-item');
        if (calendarBtn) {
            calendarBtn.addEventListener('click', () => showCalendar());
        } else {
            console.error('Calendar button with class ".calendar-item" not found!');
        }
    }
    
    // Public API
    return {
        init,
        showCalendar,
        hideCalendar,
        generateCalendar,
        formatDate
    };
})();

// Initialize when the DOM is loaded
document.addEventListener('DOMContentLoaded', Calendar.init);
