-- CreateTable
CREATE TABLE "writing_entries" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "mode" TEXT NOT NULL,
    "level" TEXT NOT NULL,
    "promptText" TEXT,
    "userText" TEXT NOT NULL,
    "correctedText" TEXT,
    "feedback" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "writing_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "daily_prompts" (
    "id" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "level" TEXT NOT NULL,
    "englishText" TEXT NOT NULL,
    "hints" JSONB,
    "sampleAnswer" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "daily_prompts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "daily_prompts_date_key" ON "daily_prompts"("date");

-- AddForeignKey
ALTER TABLE "writing_entries" ADD CONSTRAINT "writing_entries_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
