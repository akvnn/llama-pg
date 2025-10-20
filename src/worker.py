from arq import cron

from src.configuration import config as settings

# TODO: integrate pgai worker into the existing parser worker (1 container for both together)
class WorkerSettings:
    cron_jobs = [
        cron(
            "src.worker_main.parser_runner",
            minute={m for m in range(0, 60, 15)},
            run_at_startup=True,
            max_tries=2,
            timeout=600,
        ),
    ]
    redis_settings = settings.REDIS_ARQ_SETTINGS
    max_jobs = settings.REDIS_ARQ_MAX_JOBS
