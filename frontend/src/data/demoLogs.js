/**
 * Demo log datasets for testing ingestion
 */

export const DEMO_DATASETS = [
  {
    id: 'memory-leak-cascade',
    name: 'Memory Leak Cascade During Black Friday Flash Sale',
    description: 'During a high-traffic flash sale event, the inventory-service begins exhibiting a severe memory leak. This causes OOMKill events, leading to failed stock checks, payment processing delays, and a cascading failure across dependent services.',
    logs: `2024-11-29T14:59:45.123Z web-gateway[34]: [INFO] [req-id: 4d2f1a8b] GET /api/v1/products/limited-edition-sneaker - 200 OK - 45ms
2024-11-29T14:59:45.156Z inventory-service[12]: [INFO] [req-id: 4d2f1a8b] Checking stock for product: limited-edition-sneaker
2024-11-29T14:59:45.157Z redis-cache[7]: [DEBUG] Command: GET inventory:limited-edition-sneaker
2024-11-29T14:59:45.159Z inventory-service[12]: [INFO] Cache hit for product limited-edition-sneaker. Stock: 5
2024-11-29 14:59:45.234 UTC [auth-service[28]] [INFO] [req-id: a7e3f9c1] Validating token for user: user_98712
2024-11-29T14:59:45.289Z web-gateway[34]: [INFO] [req-id: b8c2d4e5] POST /api/v1/orders - 202 Accepted - 102ms
2024-11-29T14:59:45.291Z order-service[41]: [INFO] [req-id: b8c2d4e5] [user: user_98712] Creating new order for product limited-edition-sneaker
2024-11-29T14:59:45.295Z inventory-service[12]: [INFO] [req-id: b8c2d4e5] Reserving stock: 1 for product limited-edition-sneaker
2024-11-29T14:59:45.301Z inventory-service[12]: [WARN] [req-id: b8c2d4e5] Stock reservation successful. Remaining: 4
2024-11-29T14:59:45.450Z web-gateway[34]: [INFO] [req-id: f1d2e3a4] GET /api/v1/products/limited-edition-sneaker - 200 OK - 52ms
2024-11-29T14:59:45.452Z inventory-service[12]: [INFO] [req-id: f1d2e3a4] Checking stock for product: limited-edition-sneaker
2024-11-29T14:59:45.453Z redis-cache[7]: [DEBUG] Command: GET inventory:limited-edition-sneaker
2024-11-29T14:59:45.455Z inventory-service[12]: [INFO] Cache hit for product limited-edition-sneaker. Stock: 4
2024-11-29 14:59:45.523 UTC [auth-service[28]] [INFO] Validating token for user: user_45231
2024-11-29T14:59:45.578Z web-gateway[34]: [INFO] [req-id: c9d8e7f6] POST /api/v1/orders - 202 Accepted - 98ms
2024-11-29T14:59:45.581Z order-service[41]: [INFO] [req-id: c9d8e7f6] [user: user_45231] Creating new order for product limited-edition-sneaker
2024-11-29T14:59:45.583Z inventory-service[12]: [INFO] [req-id: c9d8e7f6] Reserving stock: 1 for product limited-edition-sneaker
2024-11-29T14:59:45.590Z inventory-service[12]: [WARN] [req-id: c9d8e7f6] Stock reservation successful. Remaining: 3
2024-11-29T14:59:45.812Z web-gateway[34]: [INFO] [req-id: a1b2c3d4] GET /api/v1/products/limited-edition-sneaker - 200 OK - 41ms
2024-11-29T14:59:45.814Z inventory-service[12]: [INFO] [req-id: a1b2c3d4] Checking stock for product: limited-edition-sneaker
2024-11-29T14:59:45.815Z redis-cache[7]: [DEBUG] Command: GET inventory:limited-edition-sneaker
2024-11-29T14:59:45.817Z inventory-service[12]: [INFO] Cache hit for product limited-edition-sneaker. Stock: 3
2024-11-29 14:59:45.891 UTC [auth-service[28]] [INFO] Validating token for user: user_87654
2024-11-29T14:59:45.923Z web-gateway[34]: [INFO] [req-id: e5f6g7h8] POST /api/v1/orders - 202 Accepted - 105ms
2024-11-29T14:59:45.926Z order-service[41]: [INFO] [req-id: e5f6g7h8] [user: user_87654] Creating new order for product limited-edition-sneaker
2024-11-29T14:59:45.928Z inventory-service[12]: [INFO] [req-id: e5f6g7h8] Reserving stock: 1 for product limited-edition-sneaker
2024-11-29T14:59:45.935Z inventory-service[12]: [WARN] [req-id: e5f6g7h8] Stock reservation successful. Remaining: 2
2024-11-29 14:59:45.999 UTC inventory-service[12]: GC (Allocation Failure) 512M->612M, 0.045 secs
2024-11-29T14:59:46.112Z web-gateway[34]: [INFO] [req-id: i9j0k1l2] GET /api/v1/products/limited-edition-sneaker - 200 OK - 61ms
2024-11-29T14:59:46.114Z inventory-service[12]: [INFO] [req-id: i9j0k1l2] Checking stock for product: limited-edition-sneaker
2024-11-29T14:59:46.115Z redis-cache[7]: [DEBUG] Command: GET inventory:limited-edition-sneaker
2024-11-29T14:59:46.117Z inventory-service[12]: [INFO] Cache hit for product limited-edition-sneaker. Stock: 2
2024-11-29 14:59:46.188 UTC [auth-service[28]] [INFO] Validating token for user: user_12987
2024-11-29T14:59:46.223Z web-gateway[34]: [INFO] [req-id: m3n4o5p6] POST /api/v1/orders - 202 Accepted - 92ms
2024-11-29T14:59:46.225Z order-service[41]: [INFO] [req-id: m3n4o5p6] [user: user_12987] Creating new order for product limited-edition-sneaker
2024-11-29T14:59:46.227Z inventory-service[12]: [ERROR] [req-id: m3n4o5p6] Failed to connect to Redis for stock check. Error: connection refused
2024-11-29T14:59:46.228Z inventory-service[12]: [WARN] [req-id: m3n4o5p6] Falling back to database stock check
2024-11-29 14:59:46.231 UTC db[postgres-15]: [DEBUG] duration: 2.123 ms  statement: SELECT stock_count FROM inventory WHERE product_id = 'limited-edition-sneaker' FOR UPDATE
2024-11-29T14:59:46.235Z inventory-service[12]: [WARN] [req-id: m3n4o5p6] Stock in DB: 2. Reserving.
2024-11-29T14:59:46.241Z inventory-service[12]: [WARN] [req-id: m3n4o5p6] Stock reservation successful. Remaining: 1
2024-11-29 14:59:46.302 UTC inventory-service[12]: GC (Allocation Failure) 612M->723M, 0.051 secs
2024-11-29T14:59:46.398Z web-gateway[34]: [INFO] [req-id: q7r8s9t0] GET /api/v1/products/limited-edition-sneaker - 200 OK - 78ms
2024-11-29T14:59:46.400Z inventory-service[12]: [INFO] [req-id: q7r8s9t0] Checking stock for product: limited-edition-sneaker
2024-11-29T14:59:46.402Z inventory-service[12]: [ERROR] [req-id: q7r8s9t0] Redis connection pool timeout
2024-11-29T14:59:46.403Z inventory-service[12]: [WARN] [req-id: q7r8s9t0] Falling back to database stock check
2024-11-29 14:59:46.406 UTC db[postgres-15]: [DEBUG] duration: 1.891 ms  statement: SELECT stock_count FROM inventory WHERE product_id = 'limited-edition-sneaker' FOR UPDATE
2024-11-29T14:59:46.409Z inventory-service[12]: [INFO] [req-id: q7r8s9t0] Stock in DB: 1
2024-11-29 14:59:46.482 UTC [auth-service[28]] [INFO] Validating token for user: user_33456
2024-11-29T14:59:46.523Z web-gateway[34]: [INFO] [req-id: u1v2w3x4] POST /api/v1/orders - 202 Accepted - 121ms
2024-11-29T14:59:46.525Z order-service[41]: [INFO] [req-id: u1v2w3x4] [user: user_33456] Creating new order for product limited-edition-sneaker
2024-11-29T14:59:46.527Z inventory-service[12]: [INFO] [req-id: u1v2w3x4] Reserving stock: 1 for product limited-edition-sneaker
2024-11-29T14:59:46.528Z inventory-service[12]: [ERROR] [req-id: u1v2w3x4] All Redis connections are busy. Circuit breaker opened.
2024-11-29T14:59:46.529Z inventory-service[12]: [WARN] [req-id: u1v2w3x4] Falling back to database stock check
2024-11-29 14:59:46.533 UTC db[postgres-15]: [DEBUG] duration: 2.541 ms  statement: SELECT stock_count FROM inventory WHERE product_id = 'limited-edition-sneaker' FOR UPDATE
2024-11-29T14:59:46.537Z inventory-service[12]: [INFO] [req-id: u1v2w3x4] Stock in DB: 1. Reserving.
2024-11-29T14:59:46.544Z inventory-service[12]: [INFO] [req-id: u1v2w3x4] Stock reservation successful. Remaining: 0
2024-11-29 14:59:46.612 UTC inventory-service[12]: GC (Allocation Failure) 723M->845M, 0.062 secs
2024-11-29T14:59:46.678Z web-gateway[34]: [INFO] [req-id: y5z6a7b8] GET /api/v1/products/limited-edition-sneaker - 200 OK - 92ms
2024-11-29T14:59:46.680Z inventory-service[12]: [INFO] [req-id: y5z6a7b8] Checking stock for product: limited-edition-sneaker
2024-11-29T14:59:46.681Z inventory-service[12]: [ERROR] [req-id: y5z6a7b8] Redis circuit breaker is OPEN. Failing fast.
2024-11-29T14:59:46.682Z inventory-service[12]: [WARN] [req-id: y5z6a7b8] Falling back to database stock check
2024-11-29 14:59:46.685 UTC db[postgres-15]: [DEBUG] duration: 1.112 ms  statement: SELECT stock_count FROM inventory WHERE product_id = 'limited-edition-sneaker' FOR UPDATE
2024-11-29T14:59:46.688Z inventory-service[12]: [INFO] [req-id: y5z6a7b8] Stock in DB: 0
2024-11-29T14:59:46.723Z web-gateway[34]: [INFO] [req-id: c9d0e1f2] GET /api/v1/products/limited-edition-sneaker - 200 OK - 42ms
2024-11-29T14:59:46.725Z inventory-service[12]: [INFO] [req-id: c9d0e1f2] Checking stock for product: limited-edition-sneaker
2024-11-29T14:59:46.726Z inventory-service[12]: [ERROR] [req-id: c9d0e1f2] Redis circuit breaker is OPEN. Failing fast.
2024-11-29T14:59:46.727Z inventory-service[12]: [WARN] [req-id: c9d0e1f2] Falling back to database stock check
2024-11-29 14:59:46.731 UTC db[postgres-15]: [DEBUG] duration: 1.789 ms  statement: SELECT stock_count FROM inventory WHERE product_id = 'limited-edition-sneaker' FOR UPDATE
2024-11-29T14:59:46.733Z inventory-service[12]: [INFO] [req-id: c9d0e1f2] Stock in DB: 0
2024-11-29T14:59:46.801Z web-gateway[34]: [INFO] [req-id: g3h4i5j6] POST /api/v1/orders - 409 Conflict - 89ms
2024-11-29T14:59:46.803Z order-service[41]: [INFO] [req-id: g3h4i5j6] [user: user_99871] Attempting to create order for product limited-edition-sneaker
2024-11-29T14:59:46.805Z inventory-service[12]: [INFO] [req-id: g3h4i5j6] Reserving stock: 1 for product limited-edition-sneaker
2024-11-29T14:59:46.806Z inventory-service[12]: [ERROR] [req-id: g3h4i5j6] All Redis connections are busy. Circuit breaker opened.
2024-11-29T14:59:46.807Z inventory-service[12]: [WARN] [req-id: g3h4i5j6] Falling back to database stock check
2024-11-29 14:59:46.810 UTC db[postgres-15]: [DEBUG] duration: 1.234 ms  statement: SELECT stock_count FROM inventory WHERE product_id = 'limited-edition-sneaker' FOR UPDATE
2024-11-29T14:59:46.812Z inventory-service[12]: [INFO] [req-id: g3h4i5j6] Stock in DB: 0
2024-11-29T14:59:46.813Z inventory-service[12]: [WARN] [req-id: g3h4i5j6] Out of stock for product limited-edition-sneaker
2024-11-29 14:59:46.889 UTC inventory-service[12]: GC (Allocation Failure) 845M->978M, 0.071 secs
2024-11-29T14:59:46.978Z worker-service[9]: [INFO] Processing payment batch job
2024-11-29 14:59:47.102 UTC inventory-service[12]: Exception in thread "http-nio-8080-exec-48" java.lang.OutOfMemoryError: Java heap space
2024-11-29 14:59:47.103 UTC inventory-service[12]: at java.util.Arrays.copyOf(Arrays.java:3332)
2024-11-29 14:59:47.103 UTC inventory-service[12]: at java.lang.AbstractStringBuilder.ensureCapacityInternal(AbstractStringBuilder.java:124)
2024-11-29 14:59:47.103 UTC inventory-service[12]: at java.lang.AbstractStringBuilder.append(AbstractStringBuilder.java:448)
2024-11-29 14:59:47.103 UTC inventory-service[12]: at java.lang.StringBuilder.append(StringBuilder.java:136)
2024-11-29 14:59:47.103 UTC inventory-service[12]: at com.example.inventory.StockCache.updateCache(StockCache.java:87)
2024-11-29 14:59:47.103 UTC inventory-service[12]: at com.example.inventory.StockCache.getStock(StockCache.java:45)
2024-11-29 14:59:47.103 UTC inventory-service[12]: at com.example.inventory.service.StockService.checkStock(StockService.java:28)
2024-11-29 14:59:47.103 UTC inventory-service[12]: ... 5 more
2024-11-29T14:59:47.105Z inventory-service[12]: [CRITICAL] JVM is stopping. Heap dump might be triggered.
2024-11-29T14:59:47.156Z web-gateway[34]: [ERROR] [req-id: k7l8m9n0] GET /api/v1/products/limited-edition-sneaker - 503 Service Unavailable - 105ms
2024-11-29T14:59:47.158Z web-gateway[34]: [ERROR] [req-id: k7l8m9n0] Upstream service 'inventory-service' is unreachable
2024-11-29T14:59:47.201Z scheduler-service[6]: [INFO] Triggering scheduled task: metrics-collection
2024-11-29T14:59:47.223Z web-gateway[34]: [INFO] [req-id: o1p2q3r4] POST /api/v1/orders - 503 Service Unavailable - 12ms
2024-11-29T14:59:47.224Z web-gateway[34]: [ERROR] [req-id: o1p2q3r4] Upstream service 'inventory-service' is unreachable
2024-11-29T14:59:47.256Z inventory-service[12]: [INFO] Container health check failed: /health returned 500
2024-11-29T14:59:47.278Z web-gateway[34]: [INFO] [req-id: s5t6u7v8] GET /api/v1/products/limited-edition-sneaker - 503 Service Unavailable - 10ms
2024-11-29T14:59:47.279Z web-gateway[34]: [ERROR] [req-id: s5t6u7v8] Upstream service 'inventory-service' is unreachable
2024-11-29T14:59:47.301Z payment-service[19]: [INFO] Processing payment for order order_98721
2024-11-29T14:59:47.303Z payment-service[19]: [ERROR] Failed to reserve stock for order order_98721. Inventory service unavailable. Retry in 100ms.
2024-11-29T14:59:47.311Z worker-service[9]: [WARN] Payment batch job delayed due to inventory-service unavailability
2024-11-29T14:59:47.345Z metrics-service[22]: [WARN] inventory-service is reporting 0/5 ready replicas
2024-11-29T14:59:47.401Z payment-service[19]: [INFO] Retry 1: Reserving stock for order order_98721
2024-11-29T14:59:47.402Z payment-service[19]: [ERROR] Failed to reserve stock for order order_98721. Inventory service unavailable.
2024-11-29T14:59:47.478Z web-gateway[34]: [INFO] [req-id: w9x0y1z2] GET /api/v1/products/limited-edition-sneaker - 503 Service Unavailable - 11ms
2024-11-29T14:59:47.502Z scheduler-service[6]: [INFO] Triggered scheduled task: db-backup-check
2024-11-29T14:59:47.512Z inventory-service[12]: [INFO] Container terminated: OOMKilled.
2024-11-29T14:59:47.523Z auth-service[28]: [INFO] New token issued for user: user_11223
2024-11-29T14:59:47.589Z payment-service[19]: [CRITICAL] Payment processing stuck for order order_98721. Moving to dead-letter queue.
2024-11-29T14:59:47.601Z web-gateway[34]: [INFO] [req-id: a3b4c5d6] GET /api/v1/products/limited-edition-sneaker - 503 Service Unavailable - 10ms
2024-11-29T14:59:47.702Z worker-service[9]: [ERROR] Payment batch job failed. Error: Inventory service unavailable for 5 consecutive retries.
2024-11-29T14:59:47.801Z order-service[41]: [INFO] [req-id: e7f8g9h0] [user: user_55667] Order creation request queued
2024-11-29T14:59:47.803Z order-service[41]: [WARN] [req-id: e7f8g9h0] inventory-service unavailable. Order placed in pending state.
2024-11-29T14:59:47.901Z metrics-service[22]: [INFO] kubelet restarted container inventory-service-6b9f7d8c45-abcde
2024-11-29T14:59:48.001Z inventory-service[18]: [INFO] Starting InventoryService v1.2.3
2024-11-29T14:59:48.023Z inventory-service[18]: [INFO] Connected to Redis cache
2024-11-29 14:59:48.045 UTC inventory-service[18]: GC (Metadata GC Threshold) 128M->64M, 0.023 secs
2024-11-29T14:59:48.112Z web-gateway[34]: [INFO] [req-id: i1j2k3l4] GET /api/v1/products/limited-edition-sneaker - 200 OK - 45ms
2024-11-29T14:59:48.114Z inventory-service[18]: [INFO] [req-id: i1j2k3l4] Checking stock for product: limited-edition-sneaker
2024-11-29T14:59:48.115Z redis-cache[7]: [DEBUG] Command: GET inventory:limited-edition-sneaker
2024-11-29T14:59:48.117Z inventory-service[18]: [INFO] Cache hit for product limited-edition-sneaker. Stock: 0
2024-11-29 14:59:48.189 UTC [auth-service[28]] [INFO] Validating token for user: user_99871
2024-11-29T14:59:48.223Z web-gateway[34]: [INFO] [req-id: m5n6o7p8] POST /api/v1/orders - 409 Conflict - 92ms
2024-11-29T14:59:48.225Z order-service[41]: [INFO] [req-id: m5n6o7p8] [user: user_99871] Attempting to create order for product limited-edition-sneaker
2024-11-29T14:59:48.227Z inventory-service[18]: [INFO] [req-id: m5n6o7p8] Reserving stock: 1 for product limited-edition-sneaker
2024-11-29T14:59:48.228Z redis-cache[7]: [DEBUG] Command: DECR inventory:limited-edition-sneaker
2024-11-29T14:59:48.231Z inventory-service[18]: [WARN] [req-id: m5n6o7p8] Stock reservation failed: product limited-edition-sneaker is out of stock (Redis returned -1)
2024-11-29T14:59:48.289Z metrics-service[22]: [INFO] inventory-service replica is healthy
`,
  },
  {
    id: 'db-failover-chain-reaction',
    name: 'Database Failover Chain Reaction Takes Down Auth Service',
    description: 'A primary PostgreSQL failover triggers a cascading failure as auth-service connection pools exhaust, leading to widespread authentication failures and a near-complete site outage during peak traffic.',
    logs: `2026-02-13T09:52:15.123Z web-gateway[42]: [INFO] [req-id: 8f3a2b1c] GET /api/v1/users/profile - 401 Unauthorized - 12ms
2026-02-13T09:52:15.156Z auth-service[23]: [INFO] [req-id: 8f3a2b1c] Token validation failed: expired
2026-02-13T09:52:15.189Z web-gateway[42]: [INFO] [req-id: 4d7e9f2a] POST /api/v1/auth/refresh - 200 OK - 67ms
2026-02-13 09:52:15.234 UTC auth-service[23]: [DEBUG] [req-id: 4d7e9f2a] Validating refresh token for user_78234
2026-02-13T09:52:15.289Z db[postgres-15]: [INFO] connection authorized: user=auth_user database=auth_db
2026-02-13T09:52:15.301Z auth-service[23]: [INFO] [req-id: 4d7e9f2a] Issued new access token for user_78234
2026-02-13T09:52:15.345Z web-gateway[42]: [INFO] [req-id: b2c3d4e5] GET /api/v1/orders/history - 200 OK - 89ms
2026-02-13T09:52:15.378Z auth-service[23]: [DEBUG] [req-id: b2c3d4e5] Token validation for user_45123: valid
2026-02-13T09:52:15.401Z order-service[37]: [INFO] [req-id: b2c3d4e5] Fetched 5 orders for user_45123
2026-02-13 09:52:15.445 UTC auth-service[23]: [INFO] Health check: database connection OK (pool size: 12/20)
2026-02-13T09:52:15.489Z web-gateway[42]: [INFO] [req-id: f6g7h8i9] POST /api/v1/auth/login - 200 OK - 134ms
2026-02-13T09:52:15.523Z auth-service[23]: [INFO] [req-id: f6g7h8i9] User user_99887 authenticated successfully
2026-02-13T09:52:15.567Z db[postgres-15]: [LOG] checkpoint starting: time
2026-02-13T09:52:15.589Z scheduler-service[8]: [INFO] Triggered scheduled task: session-cleanup
2026-02-13T09:52:15.612Z redis-cache[5]: [DEBUG] Command: DEL session:user_33445
2026-02-13T09:52:15.645Z web-gateway[42]: [INFO] [req-id: j0k1l2m3] GET /api/v1/payments/methods - 200 OK - 56ms
2026-02-13T09:52:15.678Z auth-service[23]: [DEBUG] [req-id: j0k1l2m3] Token validation for user_12987: valid
2026-02-13 09:52:15.701 UTC db[postgres-15]: [WARNING] long WAL buffer flush request, duration 123 ms
2026-02-13T09:52:15.734Z payment-service[28]: [INFO] [req-id: j0k1l2m3] Retrieved 2 payment methods for user_12987
2026-02-13T09:52:15.778Z worker-service[13]: [INFO] Processing session cleanup batch
2026-02-13T09:52:15.801Z db[postgres-15]: [ERROR] could not open file "pg_xlog/pg_xlog.9": No such file or directory
2026-02-13T09:52:15.812Z db[postgres-15]: [CRITICAL] terminating connection due to unexpected postmaster exit
2026-02-13T09:52:15.823Z auth-service[23]: [ERROR] HikariPool-1 - Connection to primary-db:5432 failed. HikariCP is trying to reconnect.
2026-02-13T09:52:15.834Z auth-service[23]: [WARN] [req-id: n4o5p6q7] Token validation failed - database unavailable. Serving stale cache where possible.
2026-02-13T09:52:15.845Z web-gateway[42]: [INFO] [req-id: n4o5p6q7] GET /api/v1/users/profile - 200 OK - 45ms (stale cache)
2026-02-13T09:52:15.856Z db[postgres-15]: [INFO] database system was interrupted; last known up at 2026-02-13 09:52:10 UTC
2026-02-13T09:52:15.867Z auth-service[23]: [ERROR] HikariPool-1 - Reconnection attempt 1 failed: Connection refused
2026-02-13T09:52:15.878Z scheduler-service[8]: [WARN] Session-cleanup task failed: database connection error
2026-02-13T09:52:15.889Z auth-service[23]: [WARN] Connection pool exhausted. 20/20 connections in waiting state.
2026-02-13T09:52:15.901Z metrics-service[31]: [INFO] Detected auth-service connection pool saturation
2026-02-13T09:52:15.912Z web-gateway[42]: [INFO] [req-id: r8s9t0u1] POST /api/v1/auth/refresh - 503 Service Unavailable - 234ms
2026-02-13T09:52:15.923Z auth-service[23]: [ERROR] [req-id: r8s9t0u1] Connection pool timeout after 200ms waiting for connection
2026-02-13T09:52:15.934Z web-gateway[42]: [ERROR] [req-id: r8s9t0u1] Upstream service 'auth-service' error: connection_pool_timeout
2026-02-13T09:52:15.945Z db[postgres-15]: [LOG] database system was not properly shut down; automatic recovery in progress
2026-02-13T09:52:15.956Z auth-service[23]: [ERROR] HikariPool-1 - Reconnection attempt 2 failed: Connection refused
2026-02-13T09:52:15.967Z auth-service[23]: [WARN] 15 requests waiting for database connection
2026-02-13T09:52:15.978Z web-gateway[42]: [INFO] [req-id: v2w3x4y5] GET /api/v1/products - 200 OK - 23ms
2026-02-13T09:52:15.989Z inventory-service[19]: [INFO] [req-id: v2w3x4y5] Returned product list
2026-02-13T09:52:16.001Z web-gateway[42]: [INFO] [req-id: z6a7b8c9] POST /api/v1/auth/login - 503 Service Unavailable - 312ms
2026-02-13T09:52:16.012Z auth-service[23]: [ERROR] [req-id: z6a7b8c9] All connections are busy (pool size 20). Request rejected.
2026-02-13T09:52:16.023Z web-gateway[42]: [ERROR] [req-id: z6a7b8c9] Upstream service 'auth-service' error: connection_pool_exhausted
2026-02-13T09:52:16.034Z auth-service[23]: [ERROR] HikariPool-1 - Reconnection attempt 3 failed: Connection refused
2026-02-13T09:52:16.045Z db[postgres-15]: [LOG] redo starts at 0/3C52D7E8
2026-02-13T09:52:16.056Z auth-service[23]: [WARN] 23 requests waiting for database connection. Circuit breaker tripped for auth operations.
2026-02-13T09:52:16.067Z web-gateway[42]: [INFO] [req-id: d0e1f2g3] GET /api/v1/cart - 401 Unauthorized - 8ms
2026-02-13T09:52:16.078Z web-gateway[42]: [WARN] [req-id: d0e1f2g3] No authorization token provided
2026-02-13T09:52:16.089Z db[postgres-15]: [LOG] redo done at 0/3C52F1A0
2026-02-13T09:52:16.101Z auth-service[23]: [ERROR] HikariPool-1 - Reconnection attempt 4 failed: Connection refused
2026-02-13T09:52:16.112Z web-gateway[42]: [INFO] [req-id: h4i5j6k7] GET /api/v1/health - 200 OK - 5ms
2026-02-13T09:52:16.123Z web-gateway[42]: [INFO] [req-id: l8m9n0o1] POST /api/v1/auth/refresh - 503 Service Unavailable - 189ms
2026-02-13T09:52:16.134Z auth-service[23]: [ERROR] [req-id: l8m9n0o1] Connection pool timeout after 150ms waiting for connection
2026-02-13T09:52:16.145Z db[postgres-15]: [LOG] database system is ready to accept connections
2026-02-13T09:52:16.156Z db[postgres-15]: [LOG] started streaming recovery to standby at port 5433
2026-02-13T09:52:16.167Z auth-service[23]: [INFO] HikariPool-1 - Successfully reconnected to new primary: standby-db:5433
2026-02-13T09:52:16.178Z auth-service[23]: [INFO] Connection pool reset. 0/20 active connections.
2026-02-13T09:52:16.189Z auth-service[23]: [WARN] Drain 27 pending requests to new connection pool
2026-02-13T09:52:16.201Z web-gateway[42]: [INFO] [req-id: p2q3r4s5] POST /api/v1/auth/login - 200 OK - 145ms
2026-02-13T09:52:16.212Z auth-service[23]: [INFO] [req-id: p2q3r4s5] User user_55667 authenticated successfully (new connection pool)
2026-02-13T09:52:16.223Z db[postgres-15]: [DEBUG] duration: 3.456 ms  statement: SELECT * FROM users WHERE id = 'user_55667'
2026-02-13T09:52:16.234Z auth-service[23]: [INFO] [req-id: t6u7v8w9] Token validation for user_11223: valid (cache hit)
2026-02-13T09:52:16.245Z web-gateway[42]: [INFO] [req-id: t6u7v8w9] GET /api/v1/orders/history - 200 OK - 67ms
2026-02-13T09:52:16.256Z order-service[37]: [INFO] [req-id: t6u7v8w9] Fetched 12 orders for user_11223
2026-02-13T09:52:16.267Z metrics-service[31]: [INFO] auth-service recovery complete. Pool utilization: 5/20
2026-02-13T09:52:16.278Z web-gateway[42]: [INFO] [req-id: x0y1z2a3] POST /api/v1/auth/logout - 200 OK - 34ms
2026-02-13T09:52:16.289Z auth-service[23]: [INFO] [req-id: x0y1z2a3] User user_33445 logged out. Session invalidated.
2026-02-13T09:52:16.301Z redis-cache[5]: [DEBUG] Command: DEL session:user_33445
2026-02-13T09:52:16.312Z db[postgres-15]: [LOG] checkpoint starting: time
2026-02-13T09:52:16.323Z scheduler-service[8]: [INFO] Retrying session-cleanup task
2026-02-13T09:52:16.334Z redis-cache[5]: [DEBUG] Command: SCAN 0 MATCH session:* COUNT 100
2026-02-13T09:52:16.345Z auth-service[23]: [INFO] Health check: database connection OK (pool size: 6/20, standby-db:5433)
2026-02-13T09:52:16.356Z web-gateway[42]: [INFO] [req-id: b4c5d6e7] GET /api/v1/users/profile - 200 OK - 78ms
2026-02-13T09:52:16.367Z auth-service[23]: [DEBUG] [req-id: b4c5d6e7] Token validation for user_88990: valid
2026-02-13T09:52:16.378Z user-service[52]: [INFO] [req-id: b4c5d6e7] Returned profile for user_88990
2026-02-13T09:52:16.389Z web-gateway[42]: [INFO] [req-id: f8g9h0i1] POST /api/v1/auth/refresh - 200 OK - 112ms
2026-02-13T09:52:16.401Z auth-service[23]: [DEBUG] [req-id: f8g9h0i1] Validating refresh token for user_66778
2026-02-13T09:52:16.412Z db[postgres-15]: [DEBUG] duration: 2.891 ms  statement: UPDATE refresh_tokens SET expires_at = NOW() + INTERVAL '7 days' WHERE user_id = 'user_66778'
2026-02-13T09:52:16.423Z auth-service[23]: [INFO] [req-id: f8g9h0i1] Issued new access token for user_66778
2026-02-13T09:52:16.434Z worker-service[13]: [INFO] Session cleanup completed: 45 stale sessions removed
2026-02-13T09:52:16.445Z web-gateway[42]: [INFO] [req-id: j2k3l4m5] GET /api/v1/payments/methods - 200 OK - 63ms
2026-02-13T09:52:16.456Z auth-service[23]: [DEBUG] [req-id: j2k3l4m5] Token validation for user_22334: valid
2026-02-13T09:52:16.467Z payment-service[28]: [INFO] [req-id: j2k3l4m5] Retrieved 1 payment method for user_22334
2026-02-13T09:52:16.478Z web-gateway[42]: [INFO] [req-id: n6o7p8q9] GET /api/v1/products/featured - 200 OK - 45ms
2026-02-13T09:52:16.489Z inventory-service[19]: [INFO] [req-id: n6o7p8q9] Returned 8 featured products
2026-02-13T09:52:16.501Z auth-service[23]: [INFO] Connection pool stabilized. 8/20 active connections.
2026-02-13T09:52:16.512Z metrics-service[31]: [INFO] auth-service health metric: OK`
  },
  {
    id: 'payment-gateway-tls-expiration',
    name: 'Payment Gateway TLS Certificate Expiration Causes Transaction Flood Failure',
    description: 'The payment gateway\'s TLS certificate expires at midnight UTC, causing all encrypted connections to fail. The payment-service enters a retry storm, exhausting connection pools and causing cascading failures across order and inventory services during peak checkout period.',
    logs: `2026-02-13T23:58:15.123Z worker-service[17]: [INFO] Processing payment batch job for 25 pending transactions
2026-02-13T23:58:15.156Z payment-service[31]: [INFO] [txn: tx_9f3a2b1c] Initiating payment for order order_88765, amount $129.99
2026-02-13T23:58:15.178Z payment-service[31]: [DEBUG] [txn: tx_9f3a2b1c] Opening TLS connection to payment-gateway.example.com:443
2026-02-13T23:58:15.189Z payment-service[31]: [ERROR] [txn: tx_9f3a2b1c] SSL handshake failed: certificate expired
2026-02-13T23:58:15.190Z payment-service[31]: [WARN] [txn: tx_9f3a2b1c] Retry 1/3 in 100ms
2026-02-13T23:58:15.201Z order-service[42]: [INFO] [req-id: d4e5f6g7] Order status check for order_88765: PENDING_PAYMENT
2026-02-13 23:58:15.234 UTC payment-service[31]: [ERROR] [txn: tx_8h7i6j5k] SSLException: PKIX path validation failed: java.security.cert.CertPathValidatorException: validity check failed
2026-02-13T23:58:15.245Z payment-service[31]: [ERROR] [txn: tx_8h7i6j5k] Certificate expired at 2026-02-13T23:59:59Z
2026-02-13T23:58:15.256Z payment-service[31]: [WARN] [txn: tx_8h7i6j5k] Retry 1/3 in 100ms
2026-02-13T23:58:15.267Z redis-cache[9]: [DEBUG] Command: GET payment:gateway:circuit:breaker
2026-02-13T23:58:15.278Z payment-service[31]: [INFO] [txn: tx_7g6f5e4d] Attempting payment for order order_55432, amount $45.50
2026-02-13T23:58:15.289Z payment-service[31]: [ERROR] [txn: tx_7g6f5e4d] SSL handshake failed: certificate expired
2026-02-13 23:58:15.301 UTC payment-service[31]: javax.net.ssl.SSLHandshakeException: PKIX path validation failed: java.security.cert.CertPathValidatorException: timestamp check failed
2026-02-13 23:58:15.301 UTC payment-service[31]:     at java.base/sun.security.ssl.Alert.createSSLException(Alert.java:131)
2026-02-13 23:58:15.301 UTC payment-service[31]:     at java.base/sun.security.ssl.TransportContext.fatal(TransportContext.java:371)
2026-02-13 23:58:15.301 UTC payment-service[31]:     at java.base/sun.security.ssl.TransportContext.fatal(TransportContext.java:314)
2026-02-13 23:58:15.301 UTC payment-service[31]:     at java.base/sun.security.ssl.TransportContext.fatal(TransportContext.java:309)
2026-02-13 23:58:15.301 UTC payment-service[31]:     at java.base/sun.security.ssl.CertificateMessage$T12CertificateConsumer.checkServerCerts(CertificateMessage.java:654)
2026-02-13 23:58:15.301 UTC payment-service[31]:     at java.base/sun.security.ssl.CertificateMessage$T12CertificateConsumer.onCertificate(CertificateMessage.java:473)
2026-02-13 23:58:15.301 UTC payment-service[31]:     at java.base/sun.security.ssl.CertificateMessage$T12CertificateConsumer.consume(CertificateMessage.java:369)
2026-02-13 23:58:15.301 UTC payment-service[31]:     ... 8 more
2026-02-13T23:58:15.312Z payment-service[31]: [WARN] [txn: tx_7g6f5e4d] Retry 1/3 in 100ms
2026-02-13T23:58:15.323Z web-gateway[55]: [INFO] [req-id: a1b2c3d4] POST /api/v1/checkout - 202 Accepted - 234ms
2026-02-13T23:58:15.334Z order-service[42]: [INFO] [req-id: a1b2c3d4] Order order_99887 created, awaiting payment
2026-02-13T23:58:15.345Z inventory-service[24]: [INFO] [req-id: a1b2c3d4] Reserved stock for order_99887
2026-02-13T23:58:15.356Z worker-service[17]: [WARN] Payment batch job: 3/25 transactions failed, retrying
2026-02-13T23:58:15.367Z payment-service[31]: [INFO] [txn: tx_9f3a2b1c] Retry 2/3 for order_88765
2026-02-13T23:58:15.378Z payment-service[31]: [ERROR] [txn: tx_9f3a2b1c] SSL handshake failed: certificate expired
2026-02-13T23:58:15.389Z payment-service[31]: [WARN] [txn: tx_9f3a2b1c] Retry 3/3 in 200ms
2026-02-13T23:58:15.401Z payment-service[31]: [INFO] [txn: tx_8h7i6j5k] Retry 2/3 for order_77654
2026-02-13T23:58:15.412Z payment-service[31]: [ERROR] [txn: tx_8h7i6j5k] SSL handshake failed: certificate expired
2026-02-13T23:58:15.423Z payment-service[31]: [CRITICAL] Payment gateway circuit breaker tripped: 15 consecutive failures
2026-02-13T23:58:15.434Z payment-service[31]: [WARN] All payment requests will fail fast for next 30 seconds
2026-02-13T23:58:15.445Z redis-cache[9]: [DEBUG] Command: SET payment:gateway:circuit:breaker "open" EX 30
2026-02-13T23:58:15.456Z web-gateway[55]: [INFO] [req-id: e5f6g7h8] POST /api/v1/checkout - 503 Service Unavailable - 45ms
2026-02-13T23:58:15.467Z web-gateway[55]: [ERROR] [req-id: e5f6g7h8] Payment service unavailable: circuit breaker open
2026-02-13T23:58:15.478Z order-service[42]: [WARN] [req-id: e5f6g7h8] Order creation aborted: payment service unavailable
2026-02-13 23:58:15.489 UTC payment-service[31]: [ERROR] [txn: tx_3c4d5e6f] Rejected: Circuit breaker is OPEN for payment gateway
2026-02-13T23:58:15.501Z scheduler-service[11]: [INFO] Triggered scheduled task: certificate-expiry-check
2026-02-13T23:58:15.512Z scheduler-service[11]: [CRITICAL] Payment gateway certificate EXPIRED at 2026-02-13T23:59:59Z. Immediate rotation required.
2026-02-13T23:58:15.523Z payment-service[31]: [INFO] [txn: tx_9f3a2b1c] Retry 3/3 for order_88765 (final attempt)
2026-02-13T23:58:15.534Z payment-service[31]: [ERROR] [txn: tx_9f3a2b1c] SSL handshake failed: certificate expired
2026-02-13T23:58:15.545Z payment-service[31]: [ERROR] [txn: tx_9f3a2b1c] Max retries exceeded for order_88765. Moving to dead letter queue.
2026-02-13T23:58:15.556Z payment-service[31]: [INFO] [txn: tx_8h7i6j5k] Retry 3/3 for order_77654
2026-02-13T23:58:15.567Z payment-service[31]: [ERROR] [txn: tx_8h7i6j5k] SSL handshake failed: certificate expired
2026-02-13T23:58:15.578Z payment-service[31]: [ERROR] [txn: tx_8h7i6j5k] Max retries exceeded for order_77654. Moving to dead letter queue.
2026-02-13T23:58:15.589Z web-gateway[55]: [INFO] [req-id: i9j0k1l2] GET /api/v1/health - 200 OK - 8ms
2026-02-13T23:58:15.601Z metrics-service[37]: [WARN] payment-service error rate: 100% in last minute
2026-02-13T23:58:15.612Z worker-service[17]: [ERROR] Payment batch job failed: 25/25 transactions failed after retries
2026-02-13T23:58:15.623Z worker-service[17]: [CRITICAL] Payment processing stalled. Dead letter queue contains 87 unprocessed transactions.
2026-02-13T23:58:15.634Z order-service[42]: [INFO] [req-id: m3n4o5p6] Checking expired orders
2026-02-13T23:58:15.645Z order-service[42]: [WARN] Found 23 orders in PENDING_PAYMENT state older than 30 minutes
2026-02-13T23:58:15.656Z inventory-service[24]: [INFO] [req-id: m3n4o5p6] Releasing stock for expired orders: order_88765, order_77654, order_55432
2026-02-13T23:58:15.667Z redis-cache[9]: [DEBUG] Command: INCRBY inventory:limited-edition-sneaker 3
2026-02-13T23:58:15.678Z auth-service[28]: [INFO] [req-id: q7r8s9t0] New token issued for user: user_44556
2026-02-13T23:58:15.689Z web-gateway[55]: [INFO] [req-id: q7r8s9t0] POST /api/v1/auth/login - 200 OK - 98ms
2026-02-13T23:58:15.701Z payment-service[31]: [INFO] Circuit breaker half-open: testing payment gateway with probe request
2026-02-13T23:58:15.712Z payment-service[31]: [DEBUG] [probe] Opening TLS connection to payment-gateway.example.com:443
2026-02-13T23:58:15.723Z payment-service[31]: [ERROR] [probe] SSL handshake failed: certificate expired
2026-02-13T23:58:15.734Z payment-service[31]: [WARN] Circuit breaker remains OPEN. Probe failed.
2026-02-13T23:58:15.745Z redis-cache[9]: [DEBUG] Command: SET payment:gateway:circuit:breaker "open" EX 60
2026-02-13 23:58:15.756 UTC ops-tool[1]: [INFO] Certificate rotation triggered by SRE for payment-gateway.example.com
2026-02-13T23:58:15.767Z scheduler-service[11]: [INFO] Detected certificate rotation in progress
2026-02-13T23:58:15.778Z payment-service[31]: [INFO] Received signal to reload TLS certificates
2026-02-13T23:58:15.789Z payment-service[31]: [INFO] Reloaded keystore from /secrets/payment-gateway.jks
2026-02-13T23:58:15.801Z payment-service[31]: [DEBUG] New certificate valid from 2026-02-14T00:00:00Z to 2027-02-14T00:00:00Z
2026-02-13T23:58:15.812Z payment-service[31]: [INFO] Circuit breaker manually reset by operator
2026-02-13T23:58:15.823Z redis-cache[9]: [DEBUG] Command: DEL payment:gateway:circuit:breaker
2026-02-13T23:58:15.834Z worker-service[17]: [INFO] Restarting payment batch job for dead letter queue (87 transactions)
2026-02-13T23:58:15.845Z payment-service[31]: [INFO] [txn: tx_9f3a2b1c-retry] Initiating payment for order_88765 (DLQ replay)
2026-02-13T23:58:15.856Z payment-service[31]: [DEBUG] [txn: tx_9f3a2b1c-retry] Opening TLS connection to payment-gateway.example.com:443
2026-02-13T23:58:15.867Z payment-service[31]: [INFO] [txn: tx_9f3a2b1c-retry] TLS handshake successful (new certificate)
2026-02-13T23:58:15.889Z payment-service[31]: [INFO] [txn: tx_9f3a2b1c-retry] Payment authorized for order_88765, amount $129.99
2026-02-13T23:58:15.901Z payment-service[31]: [INFO] [txn: tx_8h7i6j5k-retry] Initiating payment for order_77654 (DLQ replay)
2026-02-13T23:58:15.912Z payment-service[31]: [INFO] [txn: tx_8h7i6j5k-retry] TLS handshake successful
2026-02-13T23:58:15.923Z payment-service[31]: [INFO] [txn: tx_8h7i6j5k-retry] Payment authorized for order_77654, amount $89.99
2026-02-13T23:58:15.934Z order-service[42]: [INFO] Order order_88765 status updated to PAID
2026-02-13T23:58:15.945Z order-service[42]: [INFO] Order order_77654 status updated to PAID
2026-02-13T23:58:15.956Z web-gateway[55]: [INFO] [req-id: u1v2w3x4] POST /api/v1/checkout - 200 OK - 567ms
2026-02-13T23:58:15.967Z order-service[42]: [INFO] [req-id: u1v2w3x4] Order order_11223 created, payment processing
2026-02-13T23:58:15.978Z payment-service[31]: [INFO] [txn: tx_y5z6a7b8] Initiating payment for order_11223, amount $234.50
2026-02-13T23:58:15.989Z payment-service[31]: [INFO] [txn: tx_y5z6a7b8] TLS handshake successful
2026-02-13T23:58:16.001Z payment-service[31]: [INFO] [txn: tx_y5z6a7b8] Payment authorized
2026-02-13T23:58:16.012Z metrics-service[37]: [INFO] payment-service error rate returned to normal: 2%
2026-02-13T23:58:16.023Z worker-service[17]: [INFO] DLQ replay progress: 12/87 transactions processed successfully
2026-02-13T23:58:16.034Z scheduler-service[11]: [INFO] Certificate expiry check: All certificates valid`,
  },
  {
    id: 'redis-cluster-outage',
    name: 'Redis Cluster Outage Brings Down Cart, Session, and Rate Limiting',
    description: 'A network partition causes the entire Redis cluster to become unavailable, taking down session management, shopping carts, and distributed rate limiting. Services enter a degradation spiral as cached data disappears and connection pools exhaust.',
    logs: `2026-02-13T14:22:15.123Z web-gateway[47]: [INFO] [req-id: 3a4b5c6d] GET /api/v1/cart - 200 OK - 67ms
2026-02-13T14:22:15.156Z cart-service[33]: [INFO] [req-id: 3a4b5c6d] [user: user_77889] Fetching cart contents
2026-02-13T14:22:15.167Z redis-cache[12]: [DEBUG] Command: GET cart:user_77889
2026-02-13T14:22:15.178Z cart-service[33]: [INFO] [req-id: 3a4b5c6d] Cart retrieved from Redis (3 items)
2026-02-13T14:22:15.189Z web-gateway[47]: [INFO] [req-id: e7f8g9h0] POST /api/v1/auth/login - 200 OK - 89ms
2026-02-13T14:22:15.201Z auth-service[28]: [INFO] [req-id: e7f8g9h0] User user_33445 authenticated
2026-02-13T14:22:15.212Z redis-cache[12]: [DEBUG] Command: SET session:user_33445 "valid" EX 3600
2026-02-13T14:22:15.223Z web-gateway[47]: [INFO] [req-id: i1j2k3l4] GET /api/v1/products/featured - 200 OK - 34ms
2026-02-13T14:22:15.234Z inventory-service[21]: [INFO] [req-id: i1j2k3l4] Serving featured products from cache
2026-02-13T14:22:15.245Z redis-cache[12]: [DEBUG] Command: SMEMBERS products:featured
2026-02-13T14:22:15.256Z web-gateway[47]: [INFO] [req-id: m5n6o7p8] POST /api/v1/cart/add - 200 OK - 45ms
2026-02-13T14:22:15.267Z cart-service[33]: [INFO] [req-id: m5n6o7p8] [user: user_99887] Adding item: limited-edition-sneaker (1)
2026-02-13T14:22:15.278Z redis-cache[12]: [DEBUG] Command: WATCH cart:user_99887
2026-02-13T14:22:15.289Z redis-cache[12]: [DEBUG] Command: MULTI
2026-02-13T14:22:15.301Z redis-cache[12]: [DEBUG] Command: HSET cart:user_99887 limited-edition-sneaker 1
2026-02-13T14:22:15.301Z redis-cache[12]: [DEBUG] Command: EXEC
2026-02-13T14:22:15.312Z cart-service[33]: [INFO] [req-id: m5n6o7p8] Item added to cart
2026-02-13T14:22:15.323Z redis-cache[12]: [CRITICAL] Connection lost to master redis-0.redis-cluster:6379
2026-02-13T14:22:15.334Z redis-cache[12]: [ERROR] All sentinel connections failed. Marking cluster UNREACHABLE.
2026-02-13T14:22:15.345Z web-gateway[47]: [INFO] [req-id: q9r8s7t6] GET /api/v1/cart - 503 Service Unavailable - 102ms
2026-02-13T14:22:15.356Z cart-service[33]: [ERROR] [req-id: q9r8s7t6] Redis connection pool exhausted. All 20 connections in CLOSED state.
2026-02-13T14:22:15.367Z cart-service[33]: [WARN] [req-id: q9r8s7t6] Falling back to local cache, but cart data may be stale
2026-02-13T14:22:15.378Z web-gateway[47]: [INFO] [req-id: u5v6w7x8] GET /api/v1/products/limited-edition-sneaker - 200 OK - 23ms
2026-02-13T14:22:15.389Z inventory-service[21]: [INFO] [req-id: u5v6w7x8] Checking stock for product: limited-edition-sneaker
2026-02-13T14:22:15.401Z inventory-service[21]: [ERROR] [req-id: u5v6w7x8] Redis connection refused. Falling back to database.
2026-02-13T14:22:15.412Z db[postgres-15]: [DEBUG] duration: 4.234 ms statement: SELECT stock_count FROM inventory WHERE product_id = 'limited-edition-sneaker'
2026-02-13T14:22:15.423Z inventory-service[21]: [WARN] [req-id: u5v6w7x8] Stock: 45 (direct DB query - cache miss)
2026-02-13T14:22:15.434Z web-gateway[47]: [INFO] [req-id: y1z2a3b4] POST /api/v1/cart/add - 503 Service Unavailable - 156ms
2026-02-13T14:22:15.445Z cart-service[33]: [ERROR] [req-id: y1z2a3b4] Failed to add item to cart: Redis transaction failed - connection lost
2026-02-13T14:22:15.456Z cart-service[33]: [WARN] [req-id: y1z2a3b4] Cart operation queued for retry when Redis recovers
2026-02-13T14:22:15.467Z auth-service[28]: [INFO] [req-id: c4d5e6f7] Token validation for user_11223
2026-02-13T14:22:15.478Z auth-service[28]: [ERROR] [req-id: c4d5e6f7] Redis connection failed for session check
2026-02-13T14:22:15.489Z auth-service[28]: [WARN] [req-id: c4d5e6f7] Session validation degraded - checking database
2026-02-13T14:22:15.501Z db[postgres-15]: [DEBUG] duration: 2.567 ms statement: SELECT * FROM sessions WHERE user_id = 'user_11223' AND expires_at > NOW()
2026-02-13T14:22:15.512Z auth-service[28]: [INFO] [req-id: c4d5e6f7] Session valid (DB fallback)
2026-02-13 14:22:15.523 UTC web-gateway[47]: [ERROR] Rate limit exceeded for IP 203.0.113.45: 150 requests in 60 seconds
2026-02-13T14:22:15.534Z web-gateway[47]: [WARN] [req-id: g8h9i0j1] Request rejected - rate limit exceeded (429)
2026-02-13T14:22:15.545Z web-gateway[47]: [ERROR] Rate limiter: Redis cluster unreachable - falling back to local rate limiting
2026-02-13T14:22:15.556Z web-gateway[47]: [WARN] Local rate limiting active - may allow excess traffic during failover
2026-02-13T14:22:15.567Z redis-cache[12]: [ERROR] Connection refused: redis-0.redis-cluster:6379 - connect timeout
2026-02-13T14:22:15.578Z redis-cache[12]: [ERROR] Connection refused: redis-1.redis-cluster:6379 - connect timeout
2026-02-13T14:22:15.589Z redis-cache[12]: [ERROR] Connection refused: redis-2.redis-cluster:6379 - connect timeout
2026-02-13T14:22:15.601Z web-gateway[47]: [INFO] [req-id: k2l3m4n5] GET /api/v1/products - 200 OK - 45ms
2026-02-13T14:22:15.612Z inventory-service[21]: [INFO] [req-id: k2l3m4n5] Returning product list from DB (cache unavailable)
2026-02-13T14:22:15.623Z db[postgres-15]: [DEBUG] duration: 12.345 ms statement: SELECT * FROM products LIMIT 100
2026-02-13T14:22:15.634Z auth-service[28]: [ERROR] HikariPool-2 - Connection pool for auth_db exhausted: 50/50 connections active
2026-02-13T14:22:15.645Z auth-service[28]: [CRITICAL] Database connection pool saturated due to Redis fallback
2026-02-13T14:22:15.656Z web-gateway[47]: [INFO] [req-id: o6p7q8r9] POST /api/v1/auth/login - 503 Service Unavailable - 234ms
2026-02-13T14:22:15.667Z auth-service[28]: [ERROR] [req-id: o6p7q8r9] Connection pool timeout - no database connections available
2026-02-13 14:22:15.678 UTC auth-service[28]: java.sql.SQLTransientConnectionException: HikariPool-2 - Connection is not available, request timed out after 200ms
2026-02-13 14:22:15.678 UTC auth-service[28]:     at com.zaxxer.hikari.pool.HikariPool.createTimeoutException(HikariPool.java:696)
2026-02-13 14:22:15.678 UTC auth-service[28]:     at com.zaxxer.hikari.pool.HikariPool.getConnection(HikariPool.java:197)
2026-02-13 14:22:15.678 UTC auth-service[28]:     at com.zaxxer.hikari.pool.HikariPool.getConnection(HikariPool.java:162)
2026-02-13 14:22:15.678 UTC auth-service[28]:     at org.springframework.jdbc.datasource.DataSourceUtils.fetchConnection(DataSourceUtils.java:158)
2026-02-13 14:22:15.678 UTC auth-service[28]:     ... 12 more
2026-02-13T14:22:15.689Z web-gateway[47]: [INFO] [req-id: s0t1u2v3] GET /api/v1/health - 200 OK - 5ms
2026-02-13T14:22:15.701Z metrics-service[41]: [WARN] Redis cluster: 0/3 nodes reachable
2026-02-13T14:22:15.712Z metrics-service[41]: [CRITICAL] auth-service database connection pool: 100% utilized
2026-02-13T14:22:15.723Z web-gateway[47]: [INFO] [req-id: w4x5y6z7] GET /api/v1/cart - 503 Service Unavailable - 189ms
2026-02-13T14:22:15.734Z cart-service[33]: [ERROR] [req-id: w4x5y6z7] Cannot retrieve cart: Redis cluster unreachable and local cache expired
2026-02-13T14:22:15.745Z cart-service[33]: [WARN] [req-id: w4x5y6z7] Returning empty cart with warning header
2026-02-13T14:22:15.756Z web-gateway[47]: [INFO] [req-id: a8b9c0d1] POST /api/v1/checkout - 503 Service Unavailable - 267ms
2026-02-13T14:22:15.767Z order-service[39]: [ERROR] [req-id: a8b9c0d1] Cannot create order: cart service unavailable
2026-02-13T14:22:15.778Z worker-service[19]: [WARN] Session cleanup job paused: Redis unavailable
2026-02-13T14:22:15.789Z scheduler-service[14]: [INFO] Delayed job: session-cleanup (waiting for Redis)
2026-02-13T14:22:15.801Z web-gateway[47]: [INFO] [req-id: e2f3g4h5] GET /api/v1/products/limited-edition-sneaker - 200 OK - 89ms
2026-02-13T14:22:15.812Z inventory-service[21]: [WARN] [req-id: e2f3g4h5] High DB latency: 87ms (normal: 5ms) due to fallback load
2026-02-13T14:22:15.823Z db[postgres-15]: [WARNING] heavy load detected: 150 active connections (max 200)
2026-02-13T14:22:15.834Z auth-service[28]: [ERROR] 15 authentication requests timing out due to DB contention
2026-02-13T14:22:15.845Z web-gateway[47]: [INFO] [req-id: i6j7k8l9] POST /api/v1/auth/refresh - 503 Service Unavailable - 312ms
2026-02-13T14:22:15.856Z auth-service[28]: [ERROR] [req-id: i6j7k8l9] Database connection timeout after 300ms
2026-02-13T14:22:15.867Z redis-cache[12]: [INFO] Connection to redis-0.redis-cluster:6379 established (recovered)
2026-02-13T14:22:15.878Z redis-cache[12]: [INFO] Connection to redis-1.redis-cluster:6379 established (recovered)
2026-02-13T14:22:15.889Z redis-cache[12]: [INFO] Connection to redis-2.redis-cluster:6379 established (recovered)
2026-02-13T14:22:15.901Z redis-cache[12]: [INFO] Redis cluster back ONLINE. Failover complete.
2026-02-13T14:22:15.912Z metrics-service[41]: [INFO] Redis cluster: 3/3 nodes reachable
2026-02-13T14:22:15.923Z web-gateway[47]: [INFO] [req-id: m0n1o2p3] GET /api/v1/cart - 200 OK - 78ms
2026-02-13T14:22:15.934Z cart-service[33]: [INFO] [req-id: m0n1o2p3] [user: user_77889] Cart retrieved from Redis (cache recovered)
2026-02-13T14:22:15.945Z redis-cache[12]: [DEBUG] Command: GET cart:user_77889
2026-02-13T14:22:15.956Z cart-service[33]: [INFO] Processing 47 queued cart operations from degradation period
2026-02-13T14:22:15.967Z auth-service[28]: [INFO] Connection pool pressure decreasing: 35/50 connections active
2026-02-13T14:22:15.978Z auth-service[28]: [INFO] Switched back to Redis for session cache
2026-02-13T14:22:15.989Z web-gateway[47]: [INFO] [req-id: q4r5s6t7] POST /api/v1/cart/add - 200 OK - 112ms
2026-02-13T14:22:16.001Z cart-service[33]: [INFO] [req-id: q4r5s6t7] [user: user_11223] Item added to cart (Redis transaction successful)
2026-02-13T14:22:16.012Z web-gateway[47]: [INFO] Distributed rate limiter reconnected to Redis cluster
2026-02-13T14:22:16.023Z worker-service[19]: [INFO] Resuming session cleanup job
2026-02-13T14:22:16.034Z scheduler-service[14]: [INFO] Executing delayed session-cleanup task
2026-02-13T14:22:16.045Z redis-cache[12]: [DEBUG] Command: SCAN 0 MATCH session:* COUNT 1000
2026-02-13T14:22:16.056Z metrics-service[41]: [INFO] All systems nominal. Redis outage lasted 73 seconds.`,
  },
]

export default DEMO_DATASETS
