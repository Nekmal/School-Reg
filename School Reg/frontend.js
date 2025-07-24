// Frontend JavaScript - Student Form Handler
class StudentFormHandler {
    constructor() {
        this.form = document.getElementById('studentForm');
        this.submitBtn = document.getElementById('submitBtn');
        this.loading = document.getElementById('loading');
        this.successMessage = document.getElementById('successMessage');
        this.errorMessage = document.getElementById('errorMessage');
        
        this.init();
    }

    init() {
        this.form.addEventListener('submit', (e) => this.handleSubmit(e));
        this.addRealTimeValidation();
        this.addProgressIndicator();
        this.addFormEnhancements();
    }

    addRealTimeValidation() {
        const inputs = this.form.querySelectorAll('input, select, textarea');
        inputs.forEach(input => {
            input.addEventListener('blur', () => this.validateField(input));
            input.addEventListener('input', () => this.clearFieldError(input));
            input.addEventListener('keyup', () => this.updateProgress());
        });
    }

    addProgressIndicator() {
        // Create progress bar
        const progressBar = document.createElement('div');
        progressBar.className = 'form-progress';
        progressBar.id = 'formProgress';
        document.body.appendChild(progressBar);
        
        this.updateProgress();
    }

    addFormEnhancements() {
        // Add smooth focus animations
        const inputs = this.form.querySelectorAll('input, select, textarea');
        inputs.forEach(input => {
            input.addEventListener('focus', (e) => {
                e.target.parentElement.style.transform = 'translateY(-2px)';
            });
            
            input.addEventListener('blur', (e) => {
                e.target.parentElement.style.transform = 'translateY(0)';
            });
        });

        // Add auto-format for phone numbers
        const phoneInputs = this.form.querySelectorAll('input[type="tel"]');
        phoneInputs.forEach(input => {
            input.addEventListener('input', (e) => this.formatPhoneNumber(e));
        });

        // Add auto-capitalize for names
        const nameInputs = this.form.querySelectorAll('#firstName, #lastName, #parentName, #emergencyName');
        nameInputs.forEach(input => {
            input.addEventListener('input', (e) => this.capitalizeName(e));
        });
    }

    validateField(field) {
        let isValid = true;
        const value = field.value.trim();

        // Remove previous validation classes
        field.classList.remove('field-valid', 'field-invalid');

        // Basic required field validation
        if (field.hasAttribute('required') && !value) {
            isValid = false;
        }

        // Specific field validations
        switch (field.type) {
            case 'email':
                if (value && !this.isValidEmail(value)) {
                    isValid = false;
                }
                break;
            case 'tel':
                if (value && !this.isValidPhone(value)) {
                    isValid = false;
                }
                break;
            case 'date':
                if (value && !this.isValidDate(value)) {
                    isValid = false;
                }
                break;
        }

        // Name length validation
        if (['firstName', 'lastName', 'parentName', 'emergencyName'].includes(field.id)) {
            if (value && value.length < 2) {
                isValid = false;
            }
        }

        // Apply validation styling
        if (isValid && value) {
            field.classList.add('field-valid');
        } else if (!isValid) {
            field.classList.add('field-invalid');
        }

        return isValid;
    }

    clearFieldError(field) {
        field.classList.remove('field-invalid');
        if (field.value.trim()) {
            // Re-validate on input
            setTimeout(() => this.validateField(field), 300);
        }
    }

    updateProgress() {
        const requiredFields = this.form.querySelectorAll('[required]');
        const filledFields = Array.from(requiredFields).filter(field => 
            field.value.trim() !== '' && this.validateField(field)
        );
        
        const progress = (filledFields.length / requiredFields.length) * 100;
        const progressBar = document.getElementById('formProgress');
        if (progressBar) {
            progressBar.style.width = progress + '%';
        }
    }

    async handleSubmit(e) {
        e.preventDefault();
        
        // Hide previous messages
        this.hideMessages();
        
        // Validate entire form
        if (!this.validateForm()) {
            this.showError('Please fill in all required fields correctly.');
            this.scrollToFirstError();
            return;
        }

        // Show loading state
        this.showLoading();

        try {
            const formData = this.getFormData();
            const response = await this.submitToBackend(formData);
            
            if (response.success) {
                this.showSuccess(response.applicationId);
                this.resetForm();
                this.updateProgress();
            } else {
                this.showError(response.message || 'Submission failed. Please try again.');
            }
        } catch (error) {
            console.error('Submission error:', error);
            this.showError('Network error. Please check your connection and try again.');
        } finally {
            this.hideLoading();
        }
    }

    validateForm() {
        const requiredFields = this.form.querySelectorAll('[required]');
        let isValid = true;
        let firstInvalidField = null;

        requiredFields.forEach(field => {
            if (!this.validateField(field)) {
                isValid = false;
                if (!firstInvalidField) {
                    firstInvalidField = field;
                }
            }
        });

        // Store first invalid field for scrolling
        this.firstInvalidField = firstInvalidField;
        return isValid;
    }

    scrollToFirstError() {
        if (this.firstInvalidField) {
            this.firstInvalidField.scrollIntoView({ 
                behavior: 'smooth', 
                block: 'center' 
            });
            this.firstInvalidField.focus();
        }
    }

    getFormData() {
        const formData = new FormData(this.form);
        const data = {};
        
        for (let [key, value] of formData.entries()) {
            data[key] = value.trim();
        }
        
        // Add metadata
        data.submissionDate = new Date().toISOString();
        data.userAgent = navigator.userAgent;
        data.timestamp = Date.now();
        
        return data;
    }

    async submitToBackend(data) {
        // This calls the backend API simulation
        return await BackendAPI.processStudentApplication(data);
    }

    // Utility functions for validation
    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    isValidPhone(phone) {
        const cleanPhone = phone.replace(/[\s\-\(\)]/g, '');
        const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
        return phoneRegex.test(cleanPhone);
    }

    isValidDate(dateString) {
        const date = new Date(dateString);
        const today = new Date();
        const minAge = new Date(today.getFullYear() - 18, today.getMonth(), today.getDate());
        const maxAge = new Date(today.getFullYear() - 3, today.getMonth(), today.getDate());
        
        return date <= minAge && date >= new Date('1950-01-01');
    }

    // Formatting functions
    formatPhoneNumber(e) {
        let value = e.target.value.replace(/\D/g, '');
        if (value.length >= 10) {
            value = value.replace(/(\d{3})(\d{3})(\d{4})/, '($1) $2-$3');
        } else if (value.length >= 6) {
            value = value.replace(/(\d{3})(\d{3})/, '($1) $2-');
        } else if (value.length >= 3) {
            value = value.replace(/(\d{3})/, '($1) ');
        }
        e.target.value = value;
    }

    capitalizeName(e) {
        const words = e.target.value.split(' ');
        const capitalizedWords = words.map(word => 
            word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
        );
        e.target.value = capitalizedWords.join(' ');
    }

    // UI State Management
    showLoading() {
        this.submitBtn.disabled = true;
        this.submitBtn.innerHTML = '<div class="spinner" style="width: 20px; height: 20px; margin: 0 auto;"></div>';
        this.loading.style.display = 'block';
    }

    hideLoading() {
        this.submitBtn.disabled = false;
        this.submitBtn.innerHTML = 'Submit Application';
        this.loading.style.display = 'none';
    }

    showSuccess(applicationId = null) {
        const message = applicationId 
            ? `Success! Your application has been submitted successfully. Application ID: ${applicationId}. We will contact you within 2-3 business days.`
            : 'Success! Your student application has been submitted successfully. We will contact you within 2-3 business days.';
        
        this.successMessage.innerHTML = `<strong>Success!</strong> ${message}`;
        this.successMessage.style.display = 'block';
        this.successMessage.scrollIntoView({ behavior: 'smooth' });
        
        // Auto-hide after 10 seconds
        setTimeout(() => {
            this.successMessage.style.display = 'none';
        }, 10000);
    }

    showError(message) {
        this.errorMessage.innerHTML = `<strong>Error!</strong> ${message}`;
        this.errorMessage.style.display = 'block';
        this.errorMessage.scrollIntoView({ behavior: 'smooth' });
        
        // Auto-hide after 8 seconds
        setTimeout(() => {
            this.errorMessage.style.display = 'none';
        }, 8000);
    }

    hideMessages() {
        this.successMessage.style.display = 'none';
        this.errorMessage.style.display = 'none';
    }

    resetForm() {
        this.form.reset();
        
        // Clear validation classes
        const inputs = this.form.querySelectorAll('input, select, textarea');
        inputs.forEach(input => {
            input.classList.remove('field-valid', 'field-invalid');
        });
        
        // Reset progress bar
        const progressBar = document.getElementById('formProgress');
        if (progressBar) {
            progressBar.style.width = '0%';
        }
    }

    // Save draft functionality
    saveDraft() {
        const formData = this.getFormData();
        localStorage.setItem('studentFormDraft', JSON.stringify(formData));
        
        // Show temporary save indicator
        const saveIndicator = document.createElement('div');
        saveIndicator.innerHTML = '💾 Draft saved automatically';
        saveIndicator.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #28a745;
            color: white;
            padding: 10px 20px;
            border-radius: 5px;
            z-index: 1000;
            font-size: 14px;
        `;
        document.body.appendChild(saveIndicator);
        
        setTimeout(() => {
            document.body.removeChild(saveIndicator);
        }, 2000);
    }

    loadDraft() {
        const draft = localStorage.getItem('studentFormDraft');
        if (draft) {
            const data = JSON.parse(draft);
            Object.keys(data).forEach(key => {
                const field = document.getElementById(key);
                if (field && data[key]) {
                    field.value = data[key];
                }
            });
            this.updateProgress();
        }
    }
}

// Initialize the form handler when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const formHandler = new StudentFormHandler();
    
    // Load any saved draft
    formHandler.loadDraft();
    
    // Auto-save draft every 30 seconds
    setInterval(() => {
        formHandler.saveDraft();
    }, 30000);
    
    // Save draft before page unload
    window.addEventListener('beforeunload', () => {
        formHandler.saveDraft();
    });
});

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = StudentFormHandler;
}