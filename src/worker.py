import asyncio
from arq import cron
from arq.worker import create_worker
from pgai.vectorizer import Worker
from src.configuration import config as settings


class WorkerSettings:
    cron_jobs = [
        cron(
            "src.worker_runner.parser_runner",
            minute={m for m in range(0, 60, 1)},
            run_at_startup=True,
            max_tries=2,
            timeout=600,
        ),
    ]
    redis_settings = settings.REDIS_ARQ_SETTINGS
    max_jobs = settings.REDIS_ARQ_MAX_JOBS


async def main():
    """Run both arq worker and pgai worker concurrently"""
    arq_worker = create_worker(WorkerSettings)
    pgai_worker = Worker(db_url=settings.DB_URL)
    await asyncio.gather(
        # arq worker (handles parsing)
        arq_worker.main(),
        # pgai worker (handles vectorization)
        pgai_worker.run(),
    )


if __name__ == "__main__":
    asyncio.run(main())
