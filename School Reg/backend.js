// Backend API Simulation - Student Application Processing
class BackendAPI {
    
    /**
     * Main method to process student application
     * @param {Object} data - Form data from frontend
     * @returns {Object} Response object with success status and details
     */
    static async processStudentApplication(data) {
        console.log('Processing student application:', data);
        
        try {
            // Step 1: Validate application data
            const validationResult = this.validateApplicationData(data);
            if (!validationResult.isValid) {
                return { 
                    success: false, 
                    message: 'Validation failed',
                    errors: validationResult.errors 
                };
            }

            // Step 2: Check for duplicate applications
            const duplicateCheck = await this.checkDuplicateApplication(data);
            if (duplicateCheck.isDuplicate) {
                return {
                    success: false,
                    message: 'A similar application already exists for this student',
                    existingApplicationId: duplicateCheck.applicationId
                };
            }

            // Step 3: Save to database
            const applicationId = await this.saveToDatabase(data);
            
            // Step 4: Send confirmation email
            await this.sendConfirmationEmail(data.parentEmail, applicationId, data);
            
            // Step 5: Notify admin staff
            await this.notifyAdminStaff(applicationId, data);
            
            // Step 6: Schedule follow-up tasks
            await this.scheduleFollowUpTasks(applicationId, data);

            return {
                success: true,
                applicationId: applicationId,
                message: 'Application submitted successfully',
                estimatedProcessingTime: '2-3 business days'
            };

        } catch (error) {
            console.error('Error processing application:', error);
            return {
                success: false,
                message: 'Internal server error. Please try again later.',
                error: error.message
            };
        }
    }

    /**
     * Comprehensive data validation
     * @param {Object} data - Application data
     * @returns {Object} Validation result
     */
    static validateApplicationData(data) {
        const errors = [];
        
        // Student Information Validation
        if (!data.firstName || data.firstName.trim().length < 2) {
            errors.push('First name must be at least 2 characters long');
        }
        
        if (!data.lastName || data.lastName.trim().length < 2) {
            errors.push('Last name must be at least 2 characters long');
        }
        
        if (!data.dateOfBirth || !this.isValidDateOfBirth(data.dateOfBirth)) {
            errors.push('Valid date of birth is required');
        }
        
        if (!data.gender || !['male', 'female', 'other'].includes(data.gender)) {
            errors.push('Valid gender selection is required');
        }
        
        if (!data.grade || !this.isValidGrade(data.grade)) {
            errors.push('Valid grade selection is required');
        }

        // Parent Information Validation
        if (!data.parentName || data.parentName.trim().length < 2) {
            errors.push('Parent/Guardian name must be at least 2 characters long');
        }
        
        if (!data.parentEmail || !this.isValidEmail(data.parentEmail)) {
            errors.push('Valid parent email address is required');
        }
        
        if (!data.parentPhone || !this.isValidPhone(data.parentPhone)) {
            errors.push('Valid parent phone number is required');
        }
        
        if (!data.relationship || !['father', 'mother', 'guardian', 'other'].includes(data.relationship)) {
            errors.push('Valid relationship selection is required');
        }
        
        if (!data.address || data.address.trim().length < 10) {
            errors.push('Complete home address is required');
        }

        // Emergency Contact Validation
        if (!data.emergencyName || data.emergencyName.trim().length < 2) {
            errors.push('Emergency contact name is required');
        }
        
        if (!data.emergencyPhone || !this.isValidPhone(data.emergencyPhone)) {
            errors.push('Valid emergency contact phone is required');
        }

        // Business Logic Validation
        if (data.parentPhone === data.emergencyPhone) {
            errors.push('Emergency contact phone should be different from parent phone');
        }

        return {
            isValid: errors.length === 0,
            errors: errors
        };
    }

    /**
     * Check for duplicate applications
     * @param {Object} data - Application data
     * @returns {Object} Duplicate check result
     */
    static async checkDuplicateApplication(data) {
        return new Promise((resolve) => {
            setTimeout(() => {
                // Simulate database query for duplicates
                const existingApplications = JSON.parse(
                    localStorage.getItem('studentApplications') || '[]'
                );
                
                const duplicate = existingApplications.find(app => 
                    app.firstName === data.firstName &&
                    app.lastName === data.lastName &&
                    app.dateOfBirth === data.dateOfBirth &&
                    app.parentEmail === data.parentEmail
                );
                
                resolve({
                    isDuplicate: !!duplicate,
                    applicationId: duplicate ? duplicate.id : null
                });
            }, 500);
        });
    }

    /**
     * Save application to database
     * @param {Object} data - Application data
     * @returns {String} Application ID
     */
    static async saveToDatabase(data) {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                try {
                    const applicationId = 'APP' + Date.now() + Math.random().toString(36).substr(2, 5).toUpperCase();
                    
                    const applicationRecord = {
                        id: applicationId,
                        ...data,
                        status: 'pending',
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString(),
                        stage: 'submitted',
                        priority: this.calculatePriority(data),
                        assignedTo: null,
                        documents: [],
                        notes: []
                    };
                    
                    // Simulate saving to database
                    const existingApplications = JSON.parse(
                        localStorage.getItem('studentApplications') || '[]'
                    );
                    existingApplications.push(applicationRecord);
                    localStorage.setItem('studentApplications', JSON.stringify(existingApplications));
                    
                    // Also save to audit log
                    this.logAuditEvent(applicationId, 'APPLICATION_CREATED', data);
                    
                    console.log('Application saved to database:', applicationRecord);
                    resolve(applicationId);
                    
                } catch (error) {
                    reject(new Error('Database save failed: ' + error.message));
                }
            }, 800);
        });
    }

    /**
     * Send confirmation email to parent
     * @param {String} email - Parent email
     * @param {String} applicationId - Application ID
     * @param {Object} data - Application data
     */
    static async sendConfirmationEmail(email, applicationId, data) {
        return new Promise((resolve) => {
            setTimeout(() => {
                const emailContent = {
                    to: email,
                    subject: `Application Confirmation - ${data.firstName} ${data.lastName}`,
                    html: `
                        <h2>🎓 Bright Future Academy - Application Received</h2>
                        <p>Dear ${data.parentName},</p>
                        <p>Thank you for submitting an application for <strong>${data.firstName} ${data.lastName}</strong>.</p>
                        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
                            <h3>Application Details:</h3>
                            <p><strong>Application ID:</strong> ${applicationId}</p>
                            <p><strong>Student Name:</strong> ${data.firstName} ${data.lastName}</p>
                            <p><strong>Grade Applied:</strong> ${data.grade}</p>
                            <p><strong>Submission Date:</strong> ${new Date().toLocaleDateString()}</p>
                        </div>
                        <h3>Next Steps:</h3>
                        <ol>
                            <li>Our admissions team will review your application within 2-3 business days</li>
                            <li>You will receive an email with the admission decision</li>
                            <li>If accepted, enrollment instructions will be provided</li>
                        </ol>
                        <p>If you have any questions, please contact us at admissions@brightfutureacademy.edu</p>
                        <p>Best regards,<br>Bright Future Academy Admissions Team</p>
                    `,
                    timestamp: new Date().toISOString()
                };
                
                // Simulate email sending
                console.log('Confirmation email sent:', emailContent);
                this.logAuditEvent(applicationId, 'CONFIRMATION_EMAIL_SENT', { email: email });
                resolve(true);
            }, 300);
        });
    }

    /**
     * Notify admin staff about new application
     * @param {String} applicationId - Application ID
     * @param {Object} data - Application data
     */
    static async notifyAdminStaff(applicationId, data) {
        return new Promise((resolve) => {
            setTimeout(() => {
                const notification = {
                    type: 'NEW_APPLICATION',
                    applicationId: applicationId,
                    studentName: `${data.firstName} ${data.lastName}`,
                    grade: data.grade,
                    priority: this.calculatePriority(data),
                    timestamp: new Date().toISOString(),
                    assignTo: this.getAssignedAdmissionsOfficer(data.grade)
                };
                
                console.log('Admin notification sent:', notification);
                this.logAuditEvent(applicationId, 'ADMIN_NOTIFIED', notification);
                resolve(true);
            }, 200);
        });
    }

    /**
     * Schedule follow-up tasks
     * @param {String} applicationId - Application ID
     * @param {Object} data - Application data
     */
    static async scheduleFollowUpTasks(applicationId, data) {
        return new Promise((resolve) => {
            setTimeout(() => {
                const tasks = [
                    {
                        type: 'REVIEW_APPLICATION',
                        applicationId: applicationId,
                        dueDate: this.addBusinessDays(new Date(), 2),
                        priority: 'high',
                        assignedTo: this.getAssignedAdmissionsOfficer(data.grade)
                    },
                    {
                        type: 'SEND_DECISION_EMAIL',
                        applicationId: applicationId,
                        dueDate: this.addBusinessDays(new Date(), 3),
                        priority: 'medium',
                        assignedTo: 'admissions@brightfutureacademy.edu'
                    }
                ];
                
                console.log('Follow-up tasks scheduled:', tasks);
                this.logAuditEvent(applicationId, 'TASKS_SCHEDULED', { tasks: tasks.length });
                resolve(tasks);
            }, 100);
        });
    }

    // Utility Functions
    static isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    static isValidPhone(phone) {
        const cleanPhone = phone.replace(/[\s\-\(\)]/g, '');
        const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
        return phoneRegex.test(cleanPhone);
    }

    static isValidDateOfBirth(dateString) {
        const date = new Date(dateString);
        const today = new Date();
        const minAge = new Date(today.getFullYear() - 18, today.getMonth(), today.getDate());
        const maxAge = new Date(today.getFullYear() - 3, today.getMonth(), today.getDate());
        
        return date <= today && date >= new Date('1950-01-01');
    }

    static isValidGrade(grade) {
        const validGrades = [
            'kindergarten', 'grade1', 'grade2', 'grade3', 'grade4', 'grade5',
            'grade6', 'grade7', 'grade8', 'grade9', 'grade10', 'grade11', 'grade12'
        ];
        return validGrades.includes(grade);
    }

    static calculatePriority(data) {
        let priority = 'normal';
        
        // High priority for kindergarten and grade 1
        if (['kindergarten', 'grade1'].includes(data.grade)) {
            priority = 'high';
        }
        
        // High priority if special needs mentioned
        if (data.specialNeeds && data.specialNeeds.trim().length > 0) {
            priority = 'high';
        }
        
        // Medium priority for medical conditions
        if (data.medicalInfo && data.medicalInfo.trim().length > 0) {
            priority = 'medium';
        }
        
        return priority;
    }

    static getAssignedAdmissionsOfficer(grade) {
        const assignments = {
            'kindergarten': 'sarah.johnson@brightfutureacademy.edu',
            'grade1': 'sarah.johnson@brightfutureacademy.edu',
            'grade2': 'sarah.johnson@brightfutureacademy.edu',
            'grade3': 'michael.brown@brightfutureacademy.edu',
            'grade4': 'michael.brown@brightfutureacademy.edu',
            'grade5': 'michael.brown@brightfutureacademy.edu',
            'grade6': 'lisa.davis@brightfutureacademy.edu',
            'grade7': 'lisa.davis@brightfutureacademy.edu',
            'grade8': 'lisa.davis@brightfutureacademy.edu',
            'grade9': 'robert.wilson@brightfutureacademy.edu',
            'grade10': 'robert.wilson@brightfutureacademy.edu',
            'grade11': 'robert.wilson@brightfutureacademy.edu',
            'grade12': 'robert.wilson@brightfutureacademy.edu'
        };
        
        return assignments[grade] || 'admissions@brightfutureacademy.edu';
    }

    static addBusinessDays(date, days) {
        const result = new Date(date);
        let addedDays = 0;
        
        while (addedDays < days) {
            result.setDate(result.getDate() + 1);
            // Skip weekends
            if (result.getDay() !== 0 && result.getDay() !== 6) {
                addedDays++;
            }
        }
        
        return result;
    }

    static logAuditEvent(applicationId, eventType, data) {
        const auditEntry = {
            applicationId: applicationId,
            eventType: eventType,
            data: data,
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent
        };
        
        const auditLog = JSON.parse(localStorage.getItem('auditLog') || '[]');
        auditLog.push(auditEntry);
        localStorage.setItem('auditLog', JSON.stringify(auditLog));
        
        console.log('Audit event logged:', auditEntry);
    }

    /**
     * Get application status
     * @param {String} applicationId - Application ID
     * @returns {Object} Application status and details
     */
    static async getApplicationStatus(applicationId) {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                try {
                    const applications = JSON.parse(
                        localStorage.getItem('studentApplications') || '[]'
                    );
                    
                    const application = applications.find(app => app.id === applicationId);
                    
                    if (!application) {
                        reject(new Error('Application not found'));
                        return;
                    }
                    
                    resolve({
                        success: true,
                        application: application,
                        statusHistory: this.getStatusHistory(applicationId)
                    });
                    
                } catch (error) {
                    reject(new Error('Error retrieving application status'));
                }
            }, 300);
        });
    }

    static getStatusHistory(applicationId) {
        const auditLog = JSON.parse(localStorage.getItem('auditLog') || '[]');
        return auditLog.filter(entry => entry.applicationId === applicationId);
    }

    /**
     * Update application status (for admin use)
     * @param {String} applicationId - Application ID
     * @param {String} newStatus - New status
     * @param {String} notes - Admin notes
     */
    static async updateApplicationStatus(applicationId, newStatus, notes) {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                try {
                    const applications = JSON.parse(
                        localStorage.getItem('studentApplications') || '[]'
                    );
                    
                    const applicationIndex = applications.findIndex(app => app.id === applicationId);
                    
                    if (applicationIndex === -1) {
                        reject(new Error('Application not found'));
                        return;
                    }
                    
                    applications[applicationIndex].status = newStatus;
                    applications[applicationIndex].updatedAt = new Date().toISOString();
                    applications[applicationIndex].notes.push({
                        note: notes,
                        timestamp: new Date().toISOString(),
                        author: 'admin'
                    });
                    
                    localStorage.setItem('studentApplications', JSON.stringify(applications));
                    
                    this.logAuditEvent(applicationId, 'STATUS_UPDATED', {
                        oldStatus: applications[applicationIndex].status,
                        newStatus: newStatus,
                        notes: notes
                    });
                    
                    resolve({
                        success: true,
                        message: 'Application status updated successfully'
                    });
                    
                } catch (error) {
                    reject(new Error('Error updating application status'));
                }
            }, 200);
        });
    }
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BackendAPI;
}