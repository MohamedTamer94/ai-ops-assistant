/**
 * Demo log datasets for testing ingestion
 */

export const DEMO_DATASETS = [
  {
    id: 'auth-service',
    name: 'Auth Service Login + Warnings',
    description: 'Authentication service with login attempts and warnings',
    logs: `2024-01-15 08:23:14.123 INFO [auth-service] Starting authentication service
2024-01-15 08:23:15.456 INFO [auth-service] Listening on port 8080
2024-01-15 08:23:42.789 INFO [auth-service] User login attempt: user@example.com
2024-01-15 08:23:43.012 DEBUG [auth-service] Password hash verification in progress
2024-01-15 08:23:43.234 INFO [auth-service] Login successful for user@example.com
2024-01-15 08:24:01.567 WARN [auth-service] Failed login attempt from 192.168.1.100
2024-01-15 08:24:02.890 WARN [auth-service] Brute force detection: 3 failed attempts
2024-01-15 08:24:15.123 INFO [auth-service] Rate limiting applied to 192.168.1.100
2024-01-15 08:24:42.456 INFO [auth-service] Session token issued: sess_abc123xyz789
2024-01-15 08:25:10.789 DEBUG [auth-service] Session validation: sess_abc123xyz789
2024-01-15 08:25:11.012 INFO [auth-service] Session valid, user authenticated
2024-01-15 08:26:30.345 WARN [auth-service] Token refresh requested for expired session
2024-01-15 08:26:31.678 INFO [auth-service] New token issued successfully
2024-01-15 08:27:45.901 INFO [auth-service] User logout: user@example.com
2024-01-15 08:27:46.234 DEBUG [auth-service] Session terminated successfully`,
  },
  {
    id: 'payments-failure',
    name: 'Payments Failure + Retries',
    description: 'Payment processing service with transaction failures and retry logic',
    logs: `2024-01-15 09:10:22.111 INFO [payments] Payment service started
2024-01-15 09:10:23.222 INFO [payments] Connected to payment gateway
2024-01-15 09:10:45.333 INFO [payments] Processing transaction: txn_001 (amount: $99.99)
2024-01-15 09:10:46.444 DEBUG [payments] Calling external payment API
2024-01-15 09:10:47.555 ERROR [payments] Payment gateway timeout: txn_001
2024-01-15 09:10:47.666 INFO [payments] Retry attempt 1/3 for txn_001
2024-01-15 09:10:49.777 DEBUG [payments] Calling external payment API (retry 1)
2024-01-15 09:10:50.888 ERROR [payments] Payment gateway unavailable: txn_001
2024-01-15 09:10:50.999 INFO [payments] Retry attempt 2/3 for txn_001
2024-01-15 09:10:52.111 DEBUG [payments] Calling external payment API (retry 2)
2024-01-15 09:10:53.222 ERROR [payments] Invalid response format: txn_001
2024-01-15 09:10:53.333 INFO [payments] Retry attempt 3/3 for txn_001
2024-01-15 09:10:55.444 DEBUG [payments] Calling external payment API (retry 3)
2024-01-15 09:10:56.555 ERROR [payments] Maximum retries exceeded for txn_001
2024-01-15 09:10:56.666 ERROR [payments] Transaction failed: txn_001, status: FAILED
2024-01-15 09:10:56.777 INFO [payments] Notifying user of payment failure
2024-01-15 09:11:02.888 INFO [payments] Processing transaction: txn_002 (amount: $49.99)
2024-01-15 09:11:04.999 INFO [payments] Transaction successful: txn_002, status: COMPLETED
2024-01-15 09:11:05.111 DEBUG [payments] Payment confirmation sent to user`,
  },
  {
    id: 'java-oom',
    name: 'OOM Java Heap Space + Restart',
    description: 'Java application with out-of-memory error and service restart',
    logs: `2024-01-15 10:30:01.123 INFO [java-service] Java Service v2.1.0 started
2024-01-15 10:30:02.456 INFO [java-service] Heap size: 4096 MB
2024-01-15 10:30:03.789 INFO [java-service] Garbage Collection: G1GC
2024-01-15 10:30:15.012 INFO [java-service] Loading configuration from database
2024-01-15 10:30:20.345 DEBUG [java-service] Initialized thread pool: 16 threads
2024-01-15 10:35:01.678 INFO [java-service] Processing batch job: batch_2024_001
2024-01-15 10:35:45.901 WARN [java-service] Heap usage at 85%: 3481 MB / 4096 MB
2024-01-15 10:36:02.234 INFO [java-service] Running garbage collection cycle
2024-01-15 10:36:15.567 DEBUG [java-service] GC completed, freed 512 MB
2024-01-15 10:38:30.890 WARN [java-service] Heap usage at 92%: 3763 MB / 4096 MB
2024-01-15 10:39:45.123 ERROR [java-service] java.lang.OutOfMemoryError: Java heap space
2024-01-15 10:39:45.234 ERROR [java-service] Exception in thread "batch-processor-1"
2024-01-15 10:39:45.345 ERROR [java-service] Stack trace:
2024-01-15 10:39:45.456 ERROR [java-service]   at java.base/java.util.Arrays.copyOf(Arrays.java:3332)
2024-01-15 10:39:45.567 ERROR [java-service]   at com.service.BatchProcessor.process(BatchProcessor.java:142)
2024-01-15 10:39:45.678 ERROR [java-service]   at com.service.JobRunner.run(JobRunner.java:87)
2024-01-15 10:39:45.789 FATAL [java-service] Service is shutting down due to OOM
2024-01-15 10:39:46.890 INFO [java-service] Attempting graceful shutdown
2024-01-15 10:39:50.123 INFO [java-service] Service stopped
2024-01-15 10:39:55.456 INFO [java-service] Restarting service...
2024-01-15 10:40:01.789 INFO [java-service] Java Service v2.1.0 restarted
2024-01-15 10:40:02.012 INFO [java-service] Heap size: 4096 MB
2024-01-15 10:40:02.345 INFO [java-service] All systems operational`,
  },
  {
    id: 'mixed-services',
    name: 'Mixed Services with Python Traceback',
    description: 'Multiple services logging including a Python traceback',
    logs: `2024-01-15 11:00:01.111 INFO [api-gateway] Request received: GET /api/users/123
2024-01-15 11:00:01.222 DEBUG [api-gateway] Route matched: UserController.getUser
2024-01-15 11:00:01.333 INFO [user-service] Fetching user with ID: 123
2024-01-15 11:00:01.444 DEBUG [db-pool] Acquired connection from pool
2024-01-15 11:00:02.555 INFO [user-service] User found: john.doe@example.com
2024-01-15 11:00:02.666 DEBUG [db-pool] Returned connection to pool
2024-01-15 11:00:02.777 INFO [analytics-service] Event logged: user_view (user_id=123)
2024-01-15 11:00:03.888 DEBUG [cache] User cached with TTL 3600s
2024-01-15 11:00:04.999 INFO [api-gateway] Response sent: 200 OK (45ms)
2024-01-15 11:00:12.111 INFO [worker] Processing task: email_notification
2024-01-15 11:00:12.222 DEBUG [python-worker] Starting Python worker script
2024-01-15 11:00:13.333 ERROR [python-worker] Traceback (most recent call last):
2024-01-15 11:00:13.444 ERROR [python-worker]   File "/app/workers/email_worker.py", line 45, in send_email
2024-01-15 11:00:13.555 ERROR [python-worker]     connection = smtp_client.connect(host, port)
2024-01-15 11:00:13.666 ERROR [python-worker]   File "/app/lib/smtp.py", line 78, in connect
2024-01-15 11:00:13.777 ERROR [python-worker]     raise ConnectionError("SMTP connection failed")
2024-01-15 11:00:13.888 ERROR [python-worker] ConnectionError: SMTP connection failed
2024-01-15 11:00:13.999 WARN [worker] Task failed, retrying in 30s
2024-01-15 11:00:44.111 INFO [worker] Retrying task: email_notification
2024-01-15 11:00:44.222 DEBUG [python-worker] Starting Python worker script (attempt 2)
2024-01-15 11:00:45.333 INFO [python-worker] SMTP connection established
2024-01-15 11:00:45.444 INFO [python-worker] Email sent successfully to user@example.com
2024-01-15 11:00:45.555 INFO [worker] Task completed: email_notification`,
  },
]

export default DEMO_DATASETS
