const { spawn } = require('child_process');
const path = require('path');

const services = [
  { name: 'client', dir: 'client', command: 'npm', args: ['run', 'dev'] },
  { name: 'admin-service', dir: 'services/admin-service', command: 'npm', args: ['start'] },
  { name: 'api-gateway', dir: 'services/api-gateway', command: 'npm', args: ['start'] },
  { name: 'appointment-service', dir: 'services/appointment-service', command: 'npm', args: ['start'] },
  { name: 'auth-service', dir: 'services/auth-service', command: 'npm', args: ['start'] },
  { name: 'doctor-service', dir: 'services/doctor-service', command: 'npm', args: ['start'] },
  { name: 'notification-service', dir: 'services/notification-service', command: 'npm', args: ['start'] },
  { name: 'patient-service', dir: 'services/patient-service', command: 'npm', args: ['start'] },
  { name: 'payment-service', dir: 'services/payment-service', command: 'npm', args: ['start'] },
  { name: 'symptom-checker-service', dir: 'services/symptom-checker-service', command: 'npm', args: ['start'] },
  { name: 'telemedicine-service', dir: 'services/telemedicine-service', command: 'npm', args: ['start'] },
];

services.forEach((service) => {
  console.log(`Starting ${service.name}...`);
  const child = spawn(service.command, service.args, {
    cwd: path.join(__dirname, service.dir),
    shell: true,
    stdio: 'inherit',
  });

  child.on('error', (err) => {
    console.error(`Failed to start ${service.name}:`, err);
  });

  child.on('close', (code) => {
    console.log(`${service.name} exited with code ${code}`);
  });
});
