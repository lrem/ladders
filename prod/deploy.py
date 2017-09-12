#!/bin/env python3.6

import logging
import os
import re
import shutil
import subprocess

GIT_ROOT = "/home/ladders/git/ladders"
WEB_ROOT = "/home/ladders/web"
API_ROOT = "/home/ladders/api"
UWSGI_MASTER_PIPE = "/tmp/ladders.master"


def main() -> None:
    logging.basicConfig()
    logging.info("Checking out git.")
    build_number = checkout_and_check_signature()
    logging.info("Deploying frontend.")
    deploy_web(build_number)
    logging.info("Deploying backend.")
    deploy_api(build_number)
    logging.info("Done.")


def checkout_and_check_signature() -> int:
    """Chdir to GIT_ROOT, checkout and verify if we should deploy."""
    os.chdir(GIT_ROOT)
    head = subprocess.run(
        ["git", "log", "--all", "--pretty=format:%G? %s", "-n", "1"],
        stdout=subprocess.PIPE, encoding="utf8").stdout
    match = re.match(r"N Artifacts from Travis build (\d+).", head)
    assert match is not None, "Not pushed by Travis build."
    branch = "build-" + match.group(1)
    assert subprocess.run(["git", "checkout", branch]).returncode == 0
    before = subprocess.run(
        ["git", "log", "--all", "--pretty=format:%G? %s", "-n", "1",
            "--skip", "1"],
        stdout=subprocess.PIPE, encoding="utf8").stdout
    assert before.startswith("G "), "Not signed with a trusted signature."
    return int(match.group(1))


def deploy_web(build_number: int) -> None:
    """Move the old frontend away and copy the `dist` directory in place."""
    if os.path.exists(WEB_ROOT):
        os.rename(WEB_ROOT, WEB_ROOT + "-pre-%d" % build_number)
    shutil.copytree(os.path.join(GIT_ROOT, "web", "dist"), WEB_ROOT)


def deploy_api(build_number: int) -> None:
    """Move the old file away, new one in place and reload uwsgi."""
    for basename in ("api.py", "ranking.py"):
        script = os.path.join(API_ROOT, basename)
        if os.path.exists(script):
            os.rename(script, script+"pre-%d" % build_number)
        shutil.copy2(os.path.join(GIT_ROOT, basename), script)
    pipe = open(UWSGI_MASTER_PIPE, "w")
    pipe.write("r\n")
    pipe.close()


if __name__ == "__main__":
    main()
