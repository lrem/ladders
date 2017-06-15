#!/bin/env python3.6

import os
import re
import subprocess

GIT_ROOT = "/home/lrem/git/ladders"


def checkout_and_check_signature() -> bool:
    """Chdir to GIT_ROOT, checkout and verify if we should deploy."""
    os.chdir(GIT_ROOT)
    head = subprocess.run(
        ["git", "log", "--all", "--pretty=format:%G? %s", "-n", "1"],
        stdout=subprocess.PIPE, encoding="utf8").stdout
    match = re.match(r"N Artifacts from Travis build (\d+).", head)
    if match is None:
        return False
    branch = "build-" + match.group(1)
    assert subprocess.run(["git", "checkout", branch]).returncode == 0
    before = subprocess.run(
        ["git", "log", "--all", "--pretty=format:%G? %s", "-n", "1",
            "--skip", "1"],
        stdout=subprocess.PIPE, encoding="utf8").stdout
    return before.startswith("G ")


def main() -> None:
    if checkout_and_check_signature():
        print("We should deploy.")


if __name__ == "__main__":
    main()
