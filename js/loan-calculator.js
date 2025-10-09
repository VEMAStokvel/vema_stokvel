export function initializeLoanCalculator() {
    try {
        const loanData = {
            '500': {
                capital: 500.00,
                interest: 22.50,
                serviceFee: 52.26,
                initiationFee: 75.00,
                totalRepayment: 649.76
            },
            '1000': {
                capital: 1000.00,
                interest: 45.00,
                serviceFee: 52.26,
                initiationFee: 150.00,
                totalRepayment: 1247.26
            },
            '2000': {
                capital: 2000.00,
                interest: 90.00,
                serviceFee: 52.26,
                initiationFee: 300.00,
                totalRepayment: 2442.26
            },
            '3000': {
                capital: 3000.00,
                interest: 135.00,
                serviceFee: 52.26,
                initiationFee: 450.00,
                totalRepayment: 3637.26
            }
        };

        function updateLoanDetails() {
            const amountSelect = document.getElementById('loan-amount');
            const termSelect = document.getElementById('loan-term');
            
            if (!amountSelect || !termSelect) return;
            
            const amount = amountSelect.value;
            const term = parseInt(termSelect.value);
            const loan = loanData[amount];
            
            if (!loan) return;
            
            const monthlyPayment = loan.totalRepayment / term;
            
            // Update display elements
            document.getElementById('capital-amount').textContent = 'R' + loan.capital.toFixed(2);
            document.getElementById('interest-amount').textContent = 'R' + loan.interest.toFixed(2);
            document.getElementById('service-fee').textContent = 'R' + loan.serviceFee.toFixed(2);
            document.getElementById('initiation-fee').textContent = 'R' + loan.initiationFee.toFixed(2);
            document.getElementById('total-repayment').textContent = 'R' + loan.totalRepayment.toFixed(2);
            document.getElementById('monthly-payment').textContent = 'R' + monthlyPayment.toFixed(2);
        }

        // Event listeners
        const amountSelect = document.getElementById('loan-amount');
        const termSelect = document.getElementById('loan-term');
        
        if (amountSelect) amountSelect.addEventListener('change', updateLoanDetails);
        if (termSelect) termSelect.addEventListener('change', updateLoanDetails);
        
        // Initial update
        updateLoanDetails();
    } catch (error) {
        console.error('Error in loan calculator:', error);
    }
}