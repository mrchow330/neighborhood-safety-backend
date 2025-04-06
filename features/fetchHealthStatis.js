async function fetchHealthStatus() {
    try {
      const response = await fetch('/api/health');
      if (!response.ok) throw new Error('Server returned an error');
      const health = await response.json();
  
      const healthStatus = document.getElementById('healthStatus');
      const uptimeElement = document.getElementById('uptime');
  
      if (health.status === 'Server is running') {
        healthStatus.textContent = "Server is running";
        healthStatus.classList.remove('error');
        healthStatus.classList.add('ok');
  
        // Display total uptime
        if (health.uptime) {
          const totalUptimeInSeconds = Math.floor(health.uptime);
          const diffInMinutes = Math.floor(totalUptimeInSeconds / 60);
          const diffInHours = Math.floor(diffInMinutes / 60);
          const diffInDays = Math.floor(diffInHours / 24);
          const diffInWeeks = Math.floor(diffInDays / 7);
  
          const uptimeMessage = `Total Uptime: ${diffInWeeks}w ${diffInDays % 7}d ${diffInHours % 24}h ${diffInMinutes % 60}m ${totalUptimeInSeconds % 60}s`;
          uptimeElement.textContent = uptimeMessage;
        } else {
          uptimeElement.textContent = ""; // Clear uptime if not available
        }
      } else {
        healthStatus.textContent = "Server is down";
        healthStatus.classList.remove('ok');
        healthStatus.classList.add('error');
        uptimeElement.textContent = ""; // Clear uptime when server is down
      }
    } catch (error) {
      const healthStatus = document.getElementById('healthStatus');
      const uptimeElement = document.getElementById('uptime');
      healthStatus.textContent = "Server is down";
      healthStatus.classList.remove('ok');
      healthStatus.classList.add('error');
      uptimeElement.textContent = ""; // Clear uptime on error
    }
  }
  
  // Delay the initial health check by 3 seconds after the page loads
  setTimeout(() => {
    fetchHealthStatus();
    setInterval(fetchHealthStatus, 1000); // Check health status every second
  }, 3000);