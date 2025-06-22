from arq import cron

from src.configuration import Settings

settings = Settings()


class WorkerSettings:
    cron_jobs = [
        cron(
            "src.main.parser_runner",
            minute={m for m in range(0, 60, 15)},
            run_at_startup=True,
            max_tries=2,
            timeout=600,
        ),
    ]
    redis_settings = settings.REDIS_ARQ_SETTINGS
    max_jobs = settings.REDIS_ARQ_MAX_JOBS
