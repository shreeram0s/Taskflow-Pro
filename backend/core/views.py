from django.shortcuts import render
from django.http import HttpResponse

# Create your views here.
def home(request):
    """View function for the home page of the site."""
    return render(request, 'core/index.html', context={
        'title': 'TaskFlow Pro - Project Management Tool'
    })
