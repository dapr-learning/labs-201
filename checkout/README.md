You can open the folder in VsCode by running the following command:
```bash
code checkout
```

or

```
code .
```

if the current directory is `checkout`

Once open, make sure that the virtual environment is activated. You can do this by running the following command in the terminal:
```bash
source .venv/bin/activate
```
from the VsCode terminal.

You can then run the following command to install the dependencies:
```bash
pip install -r requirements.txt
```
> Note: `pip` or `pip3` should work in the virtual environment.