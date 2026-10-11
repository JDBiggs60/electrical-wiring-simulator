import hashlib, json, pathlib, sys, tarfile
with tarfile.open(sys.argv[1]) as source:
    members = {}
    for member in source.getmembers():
        path = pathlib.PurePosixPath(member.name)
        if path.is_absolute() or '..' in path.parts or not (member.isfile() or member.isdir()):
            raise RuntimeError('Unsafe recovery archive member')
        name = str(path)
        if name in members:
            raise RuntimeError('Duplicate recovery archive member')
        members[name] = member
    manifest = json.load(source.extractfile(members['preview/production-manifest.json']))
    if manifest['productionCommit'] != sys.argv[3] or str(manifest['productionRun']) != sys.argv[4]:
        raise RuntimeError('Recovery manifest does not match the pinned production baseline')
    expected = {entry['path']: entry['sha256'] for entry in manifest['files']}
    root_files = {name for name, member in members.items() if member.isfile() and not name.startswith('preview/')}
    if root_files != set(expected):
        raise RuntimeError('Recovery production file set differs from the pinned manifest')
    for name in root_files:
        if hashlib.sha256(source.extractfile(members[name]).read()).hexdigest() != expected[name]:
            raise RuntimeError('Recovery production hash mismatch: ' + name)
    with tarfile.open(sys.argv[2], 'w') as output:
        for name, member in members.items():
            if name == 'preview' or name.startswith('preview/'):
                continue
            output.addfile(member, source.extractfile(member) if member.isfile() else None)
