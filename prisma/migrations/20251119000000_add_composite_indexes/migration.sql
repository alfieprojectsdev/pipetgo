-- CreateIndex
CREATE INDEX "lab_services_active_category_labId_idx" ON "lab_services"("active", "category", "labId");

-- CreateIndex
CREATE INDEX "orders_clientId_status_createdAt_idx" ON "orders"("clientId", "status", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "orders_labId_status_createdAt_idx" ON "orders"("labId", "status", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "attachments_orderId_attachmentType_createdAt_idx" ON "attachments"("orderId", "attachmentType", "createdAt" DESC);
