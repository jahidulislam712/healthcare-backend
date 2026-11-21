-- CreateTable
CREATE TABLE "rag_chunks" (
    "id" TEXT NOT NULL,
    "source" VARCHAR(200) NOT NULL,
    "content" TEXT NOT NULL,
    "embedding" DOUBLE PRECISION[],
    "chunkIndex" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "rag_chunks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "rag_chunks_source_chunkIndex_key" ON "rag_chunks"("source", "chunkIndex");
